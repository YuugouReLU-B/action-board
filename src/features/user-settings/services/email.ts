import { APP_ORIGIN } from "@/lib/constants/app-origin";
import { createClient } from "@/lib/supabase/client";

/**
 * メールアドレス変更リクエストを送信
 * @param newEmail 新しいメールアドレス
 * @returns 成功時はtrue、失敗時はエラーメッセージ
 */
export async function requestEmailChange(
  newEmail: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabaseClient = createClient();

  try {
    // Supabaseでメールアドレスを更新
    const redirectUrl = new URL(
      "/settings/profile?type=email_change",
      APP_ORIGIN,
    );

    const { error } = await supabaseClient.auth.updateUser(
      {
        email: newEmail,
      },
      {
        emailRedirectTo: redirectUrl.toString(),
      },
    );

    if (error) {
      // エラーメッセージの詳細化
      if (error.message.includes("already")) {
        return {
          success: false,
          error: "このメールアドレスは既に使用されています",
        };
      }
      console.error("Email update error:", error);
      return {
        success: false,
        error: "メールアドレスの変更に失敗しました",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error during email update:", error);
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    };
  }
}
