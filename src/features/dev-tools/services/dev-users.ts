import "server-only";

import { createAdminClient } from "@/lib/supabase/adminClient";

export type DevUser = {
  id: string;
  email: string | null;
  provider: string | null;
  lineUserId: string | null;
  isOfficialAccountFriend: boolean | null;
  name: string | null;
  hasProfile: boolean;
  createdAt: string;
};

/**
 * 開発ツール用のユーザー一覧。
 *
 * 登録フローを何度も試すために、誰がどの経路で登録したかと
 * プロフィール登録済みかどうかが分かればよい。
 */
export async function listUsersForDevTools(): Promise<DevUser[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) {
    console.error("開発用ユーザー一覧の取得に失敗:", error);
    return [];
  }

  const { data: profiles } = await supabase
    .from("public_user_profiles")
    .select("id, name");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  return data.users
    .map((user) => {
      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      return {
        id: user.id,
        email: user.email ?? null,
        provider: (metadata.provider as string) ?? "email",
        lineUserId: (metadata.line_user_id as string) ?? null,
        isOfficialAccountFriend:
          typeof metadata.line_official_account_friend === "boolean"
            ? metadata.line_official_account_friend
            : null,
        name: profileMap.get(user.id) ?? null,
        hasProfile: profileMap.has(user.id),
        createdAt: user.created_at,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
