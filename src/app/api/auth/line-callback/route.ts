import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { LINE_LOGIN_COOKIE } from "@/features/auth/constants/line-login";
import { LineApiClientImpl } from "@/features/auth/services/line-api-client";
import { lineLogin } from "@/features/auth/use-cases/line-login";
import { saveCampaignAttribution } from "@/features/campaign-attribution/services/campaign-attribution";
import { grantReferralReward } from "@/features/referral/services/grant-referral-reward";
import { getOrInitializeUserLevel } from "@/features/user-level/services/level";
import { APP_ORIGIN, LINE_REDIRECT_URI } from "@/lib/constants/app-origin";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createClient } from "@/lib/supabase/client";
import { deleteCookie, getCookie } from "@/lib/utils/server-cookies";
import { calculateAge } from "@/lib/utils/utils";
import { validateReturnUrl } from "@/lib/validation/url";

const MINIMUM_AGE = 18;

function signInRedirect(error: string) {
  return NextResponse.redirect(
    new URL(`/sign-in?error=${encodeURIComponent(error)}`, APP_ORIGIN),
  );
}

/** 長さの違いで分岐しないよう固定長ハッシュ比較ではなくバイト列比較の前に長さを揃える */
function safeEquals(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function clearFlowCookies() {
  await Promise.all([
    deleteCookie(LINE_LOGIN_COOKIE.state),
    deleteCookie(LINE_LOGIN_COOKIE.dateOfBirth),
    deleteCookie(LINE_LOGIN_COOKIE.returnUrl),
  ]);
}

/**
 * LINEログインのコールバック。
 *
 * 以前は「ルートハンドラ → クライアントページ → サーバーアクション」の3ホップで、
 * state の照合が localStorage を読むクライアント側でしか行われていなかった。
 * ここに集約してサーバー側で state を検証する。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // LINE 側でのエラー（ユーザーがキャンセルした等）
    const lineError = searchParams.get("error");
    if (lineError) {
      await clearFlowCookies();
      return signInRedirect(
        lineError === "access_denied"
          ? "LINE認証がキャンセルされました。再度お試しください。"
          : searchParams.get("error_description") ||
              `LINE認証エラー: ${lineError}`,
      );
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = await getCookie(LINE_LOGIN_COOKIE.state);

    // CSRF対策: state の照合はここ（サーバー側）で行う
    if (!state || !storedState || !safeEquals(state, storedState)) {
      await clearFlowCookies();
      return signInRedirect(
        "セキュリティエラー: 認証状態が無効です。最初からやり直してください。",
      );
    }

    if (!code) {
      await clearFlowCookies();
      return signInRedirect("認証コードが取得できませんでした");
    }

    const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
    const clientSecret = process.env.LINE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      await clearFlowCookies();
      console.error("LINE認証の環境変数が設定されていません");
      return signInRedirect("LINE認証の設定が不完全です");
    }

    const dateOfBirth = await getCookie(LINE_LOGIN_COOKIE.dateOfBirth);
    // 生年月日はクライアント由来なのでサーバー側で必ず再検証する
    if (dateOfBirth && calculateAge(dateOfBirth) < MINIMUM_AGE) {
      await clearFlowCookies();
      return signInRedirect("18歳未満の方は登録できません");
    }

    const adminSupabase = await createAdminClient();
    const result = await lineLogin(
      adminSupabase,
      new LineApiClientImpl(clientId, clientSecret),
      {
        code,
        redirectUri: LINE_REDIRECT_URI,
        dateOfBirth,
        onUserCreated: async (userId) => {
          await getOrInitializeUserLevel(userId);
        },
      },
    );

    if (!result.success) {
      await clearFlowCookies();
      return signInRedirect(result.error);
    }

    // 新規登録時のみ、流入元の記録を行う
    if (result.isNewUser) {
      const referralCode = await getCookie("referral_code");
      if (referralCode && result.email) {
        await grantReferralReward(referralCode, result.email);
        await deleteCookie("referral_code");
      }

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

    // Supabase のセッションを張る。cookie は createClient のアダプタ経由で
    // このレスポンスに載る（Supabase 公式のルートハンドラ方式と同じ）
    const { error: signInError } = await createClient().auth.signInWithPassword(
      {
        email: result.email,
        password: result.tempPassword,
      },
    );

    if (signInError) {
      console.error("Failed to sign in with temporary password:", signInError);
      await clearFlowCookies();
      return signInRedirect("ログイン処理に失敗しました");
    }

    const returnUrl = validateReturnUrl(
      await getCookie(LINE_LOGIN_COOKIE.returnUrl),
    );
    await clearFlowCookies();

    const destination = result.isNewUser
      ? "/settings/profile?new=true"
      : returnUrl || "/?login=success";

    return NextResponse.redirect(new URL(destination, APP_ORIGIN));
  } catch (error) {
    console.error("LINE callback failed:", error);
    await clearFlowCookies();
    return signInRedirect("ログイン処理に失敗しました");
  }
}
