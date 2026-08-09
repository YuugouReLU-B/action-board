"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LineApiClientImpl } from "@/features/auth/services/line-api-client";
import { lineLogin } from "@/features/auth/use-cases/line-login";
import { saveCampaignAttribution } from "@/features/campaign-attribution/services/campaign-attribution";
import {
  getOrInitializeUserLevel,
  grantMissionCompletionXp,
} from "@/features/user-level/services/level";
import { getCurrentSeasonId } from "@/lib/services/seasons";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createClient } from "@/lib/supabase/client";
import { validateAge } from "@/lib/utils/age-validation";
import { deleteCookie, getCookie } from "@/lib/utils/server-cookies";
import { calculateAge, encodedRedirect } from "@/lib/utils/utils";
import {
  forgotPasswordFormSchema,
  signInAndLoginFormSchema,
  signUpAndLoginFormSchema,
} from "@/lib/validation/auth";
import {
  isEmailAlreadyUsedInReferral,
  isValidReferralCode,
} from "@/lib/validation/referral";
import { validateReturnUrl } from "@/lib/validation/url";

// useActionState用のサインインアクション
export const signInActionWithState = async (
  _prevState: {
    error?: string;
    success?: string;
    message?: string;
    formData?: {
      email: string;
    };
  } | null,
  formData: FormData,
) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const returnUrl = formData.get("returnUrl")?.toString();

  // フォームデータを保存（エラー時の状態復元用、メールアドレスのみ）
  const currentFormData = {
    email: email || "",
  };

  const validatedFields = signInAndLoginFormSchema.safeParse({
    email,
    password,
  });
  if (!validatedFields.success) {
    return {
      error: "login-error",
      formData: currentFormData,
    };
  }

  if (!email || !password) {
    return {
      error: "login-error",
      formData: currentFormData,
    };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "login-error",
      formData: currentFormData,
    };
  }

  // Validate returnUrl before redirecting
  const validatedReturnUrl = validateReturnUrl(returnUrl);

  return {
    success: "ログインに成功しました",
    redirectUrl: validatedReturnUrl || "/",
  };
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "メールアドレスが必要です",
    );
  }

  const validatedFields = forgotPasswordFormSchema.safeParse({ email });
  if (!validatedFields.success) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      validatedFields.error.errors.map((error) => error.message).join("\n"),
    );
  }

  // LINEユーザーかどうかを確認
  const serviceSupabase = await createAdminClient();

  // 効率的なPostgreSQL関数を使用してメールアドレスでユーザーを検索 (O(1))
  // listUsers()の全件取得 (O(n)) から大幅な性能改善
  const { data: userResults, error: userFetchError } =
    await serviceSupabase.rpc("get_user_by_email", { user_email: email });

  if (userFetchError) {
    console.error("get_user_by_email function failed:", userFetchError);
    throw new Error("Failed to check user existence");
  }

  const userWithEmail = userResults?.[0] || null;

  // LINEユーザーの場合、パスワードリセットは出来ない
  if (
    userWithEmail &&
    (userWithEmail.user_metadata as { provider: string })?.provider === "line"
  ) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "LINEで登録されたユーザーのパスワードリセットはできません",
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "パスワードリセットに失敗しました",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "password-reset-success",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/reset-password",
      "パスワードとパスワード確認が必要です",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect("error", "/reset-password", "パスワードが一致しません");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/reset-password",
      error.code === "same_password"
        ? "新しいパスワードは現在のパスワードと異なるものを設定してください"
        : "パスワードの更新に失敗しました",
    );
  }

  encodedRedirect("success", "/sign-in", "パスワードを更新しました");
};

export const signOutAction = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

// LINE認証用のバリデーションスキーマ
const lineAuthSchema = z.object({
  code: z.string().nonempty({ message: "Authorization code is required" }),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true; // 新規ユーザーでない場合はオプショナル
        const age = calculateAge(value);
        return age >= 18;
      },
      {
        message: "18歳未満の方は登録できません",
      },
    ),
  referralCode: z.string().optional().nullable(),
  returnUrl: z.string().optional().nullable(),
});

// LINE認証処理のServer Action
export async function handleLineAuthAction(
  code: string,
  dateOfBirth?: string,
  referralCode?: string | null,
  returnUrl?: string | null,
): Promise<
  { success: true; redirectTo: string } | { success: false; error: string }
> {
  try {
    // 1. バリデーション
    const validationResult = lineAuthSchema.safeParse({
      code,
      dateOfBirth,
      referralCode,
      returnUrl,
    });

    if (!validationResult.success) {
      return { success: false, error: "認証データが無効です" };
    }

    const {
      code: validatedCode,
      dateOfBirth: validatedDateOfBirth,
      referralCode: validatedReferralCode,
      returnUrl: validatedReturnUrl,
    } = validationResult.data;

    // 2. リファラルコードが渡されていない場合はcookieから取得
    let finalReferralCode = validatedReferralCode;
    if (!finalReferralCode) {
      const cookieReferralCode = await getCookie("referral_code");
      finalReferralCode = cookieReferralCode || null;
    }

    // 3. 依存の組み立て
    const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
    const clientSecret = process.env.LINE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("LINE認証の環境変数が設定されていません");
    }

    const origin = (await headers()).get("origin");
    const redirectUri = `${origin || "http://localhost:3000"}/api/auth/line-callback`;
    const adminSupabase = await createAdminClient();
    const lineApiClient = new LineApiClientImpl(clientId, clientSecret);

    // 4. ユースケース実行
    const result = await lineLogin(adminSupabase, lineApiClient, {
      code: validatedCode,
      redirectUri,
      dateOfBirth: validatedDateOfBirth,
      onUserCreated: async (userId) => {
        await getOrInitializeUserLevel(userId);
      },
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // 5. 紹介コード処理（新規ユーザーのみ）
    if (result.isNewUser && finalReferralCode && result.email) {
      await handleReferralCode(finalReferralCode, result.email);
      await deleteCookie("referral_code");
    }

    // キャンペーンコード処理（新規ユーザーのみ・キャラバン会場QR等の流入元計測）
    if (result.isNewUser) {
      const campaignCode = await getCookie("campaign_code");
      if (campaignCode) {
        await saveCampaignAttribution(
          adminSupabase,
          result.userId,
          campaignCode,
        );
        await deleteCookie("campaign_code");
      }
    }

    // 6. Supabaseセッション作成
    const clientSupabase = createClient();
    const { error: signInError } = await clientSupabase.auth.signInWithPassword(
      {
        email: result.email,
        password: result.tempPassword,
      },
    );

    if (signInError) {
      console.error("Failed to sign in with temporary password:", signInError);
      throw new Error("Supabaseログインに失敗しました");
    }

    // 7. リダイレクト先を返す
    const safeReturnUrl = validateReturnUrl(validatedReturnUrl || undefined);

    if (result.isNewUser) {
      return { success: true, redirectTo: "/settings/profile?new=true" };
    }

    return { success: true, redirectTo: safeReturnUrl || "/?login=success" };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "ログイン処理に失敗しました",
    };
  }
}

// 紹介コード処理
async function handleReferralCode(referralCode: string, email: string) {
  const serviceSupabase = await createAdminClient();

  try {
    // 紹介コードの検証
    const [isValid, isDuplicate] = await Promise.all([
      isValidReferralCode(referralCode),
      isEmailAlreadyUsedInReferral(email?.toLowerCase() ?? ""),
    ]);

    if (isValid && !isDuplicate) {
      const { data: mission } = await serviceSupabase
        .from("missions")
        .select("id")
        .eq("required_artifact_type", "REFERRAL")
        .maybeSingle();

      const { data: referrerRecord } = await serviceSupabase
        .from("user_referral")
        .select("user_id")
        .eq("referral_code", referralCode)
        .maybeSingle();

      if (mission && referrerRecord?.user_id) {
        const { data: achievement, error: achievementError } =
          await serviceSupabase
            .from("achievements")
            .insert({
              user_id: referrerRecord.user_id,
              mission_id: mission.id,
              season_id: await getCurrentSeasonId(),
            })
            .select("id")
            .single();

        if (achievement && !achievementError) {
          await serviceSupabase.from("mission_artifacts").insert({
            user_id: referrerRecord.user_id,
            achievement_id: achievement.id,
            artifact_type: "REFERRAL",
            text_content: email.toLowerCase(),
          });

          // XP付与
          await grantMissionCompletionXp(
            referrerRecord.user_id,
            mission.id,
            achievement.id,
          );
        }
      }
    }
  } catch (error) {
    console.warn("紹介コード処理エラー:", error);
  }
}
