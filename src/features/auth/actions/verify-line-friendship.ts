"use server";

import { checkLineFriendshipByUserId } from "@/features/auth/services/line-messaging-client";
import { grantLineFriendMission } from "@/features/auth/use-cases/grant-line-friend-mission";
import { getUser } from "@/features/user-profile/services/profile";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createClient } from "@/lib/supabase/client";

export type VerifyLineFriendshipResult =
  | { status: "granted" }
  | { status: "not_friend" }
  | { status: "unavailable" }
  | { status: "unauthenticated" };

/**
 * 「追加を確認する」ボタンの実処理。
 *
 * 以前はLINEログインをやり直して friendship/v1/status（ユーザー本人の
 * アクセストークンが必要）で確認していたが、ログイン済みなのに
 * 再度LINEログインを求められるのはUXとして悪い。
 * Messaging APIのプロフィール取得（チャネルアクセストークンのみで呼べる）
 * に切り替え、ユーザーには何も操作させずに確認する。
 */
export async function verifyLineFriendship(): Promise<VerifyLineFriendshipResult> {
  const user = await getUser();
  if (!user) return { status: "unauthenticated" };

  const lineUserId = user.user_metadata?.line_user_id as string | undefined;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineUserId || !channelAccessToken) {
    return { status: "unavailable" };
  }

  const isFriend = await checkLineFriendshipByUserId(
    lineUserId,
    channelAccessToken,
  );
  if (isFriend !== true) {
    return { status: "not_friend" };
  }

  const adminSupabase = await createAdminClient();
  const userSupabase = createClient();
  await grantLineFriendMission(adminSupabase, userSupabase, user.id);

  return { status: "granted" };
}
