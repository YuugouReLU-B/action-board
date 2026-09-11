"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/adminClient";

export type DeleteDevUserResult =
  | { success: true }
  | { success: false; error: string };

/**
 * 開発用のユーザー削除。
 *
 * 登録フローを繰り返し試すために、任意のユーザーを消せるようにする。
 * 関連データの削除は本番の退会処理と同じ delete_user_account RPC を使う。
 * 削除対象テーブルの一覧をここに複製すると、テーブルが増えたときに
 * 片方だけ取りこぼすため。
 *
 * **本番では絶対に実行させない。** /dev レイアウトが本番ビルドで 404 を返すのは
 * ページの話であり、サーバーアクションは URL を知っていれば呼べてしまうので、
 * ここでも明示的に弾く。
 */
export async function deleteDevUser(
  userId: string,
): Promise<DeleteDevUserResult> {
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "本番環境では利用できません" };
  }

  if (!userId) {
    return { success: false, error: "ユーザーIDが必要です" };
  }

  const supabase = await createAdminClient();

  const { error: rpcError } = await supabase.rpc("delete_user_account", {
    target_user_id: userId,
  });
  if (rpcError) {
    console.error("関連データの削除に失敗:", rpcError);
    return {
      success: false,
      error: `関連データの削除に失敗: ${rpcError.message}`,
    };
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("認証ユーザーの削除に失敗:", authError);
    return {
      success: false,
      error: `認証ユーザーの削除に失敗: ${authError.message}`,
    };
  }

  revalidatePath("/dev/users");
  return { success: true };
}
