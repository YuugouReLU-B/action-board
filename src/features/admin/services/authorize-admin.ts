import "server-only";

import type { User } from "@supabase/supabase-js";
import { getUser } from "@/features/user-profile/services/profile";
import { isAdmin } from "@/lib/utils/admin";

/**
 * 管理者であることを要求する。管理者でなければ例外を投げる。
 *
 * **ページの表示制御だけに頼ってはいけない。** サーバーアクションは
 * URLとペイロードを知っていれば直接呼べるので、更新処理の入口ごとに
 * これを通す。認可はactions層の責務とする方針に合わせている。
 */
export async function requireAdmin(): Promise<User> {
  const user = await getUser();

  if (!isAdmin(user)) {
    throw new Error("管理者権限が必要です");
  }

  // isAdmin が true の時点で user は非 null だが、型の上では絞り込めない
  return user as User;
}

/** 管理者かどうかだけ知りたいとき（ページの出し分け用） */
export async function currentUserIsAdmin(): Promise<boolean> {
  return isAdmin(await getUser());
}
