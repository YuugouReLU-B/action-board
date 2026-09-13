"use server";

import { revalidatePath } from "next/cache";
import { extractRoles } from "@/features/admin/services/admin-users";
import { requireAdmin } from "@/features/admin/services/authorize-admin";
import { createAdminClient } from "@/lib/supabase/adminClient";

export type AdminUserActionResult =
  | { success: true }
  | { success: false; error: string };

const ADMIN_ROLE = "admin";

/**
 * 管理者権限を付け外しする。
 *
 * 権限は auth.users の app_metadata.roles で管理している。
 * posting-admin など他のロールを持っている場合もあるので、配列ごと
 * 置き換えずに admin だけを足し引きする。
 *
 * **自分自身からは外せない。** 最後の管理者が自分を降格させると誰も
 * 管理画面に入れなくなり、復旧にSQLを直接叩く必要が出てしまう。
 */
export async function setUserAdminRole(
  userId: string,
  shouldBeAdmin: boolean,
): Promise<AdminUserActionResult> {
  const currentUser = await requireAdmin();

  if (currentUser.id === userId && !shouldBeAdmin) {
    return {
      success: false,
      error:
        "自分自身の管理者権限は外せません。他の管理者から外してもらってください",
    };
  }

  const supabase = await createAdminClient();

  const { data: target, error: fetchError } =
    await supabase.auth.admin.getUserById(userId);
  if (fetchError || !target.user) {
    console.error("対象ユーザーの取得に失敗:", fetchError);
    return { success: false, error: "対象のユーザーが見つかりません" };
  }

  const currentRoles = extractRoles(target.user.app_metadata);
  const nextRoles = shouldBeAdmin
    ? Array.from(new Set([...currentRoles, ADMIN_ROLE]))
    : currentRoles.filter((role) => role !== ADMIN_ROLE);

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { ...target.user.app_metadata, roles: nextRoles },
  });

  if (error) {
    console.error("管理者権限の変更に失敗:", error);
    return { success: false, error: `変更に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
