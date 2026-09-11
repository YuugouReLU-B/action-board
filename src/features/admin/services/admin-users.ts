import "server-only";

import { getCurrentSeason } from "@/lib/services/seasons";
import { createAdminClient } from "@/lib/supabase/adminClient";

export type AdminUserSearchResult = {
  id: string;
  name: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * デバッグ用のユーザー検索。
 *
 * ニックネームの部分一致、またはユーザーIDの完全一致で検索する。
 * 現在のアクティブシーズンのXP/レベルも一緒に返す。
 */
export async function searchUsersForAdmin(
  query: string,
): Promise<AdminUserSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createAdminClient();

  const profileQuery = supabase
    .from("public_user_profiles")
    .select("id, name, avatar_url")
    .limit(20);

  const { data: profiles, error } = UUID_PATTERN.test(trimmed)
    ? await profileQuery.eq("id", trimmed)
    : await profileQuery.ilike("name", `%${trimmed}%`);

  if (error) {
    console.error("ユーザー検索に失敗:", error);
    return [];
  }
  if (!profiles || profiles.length === 0) {
    return [];
  }

  const season = await getCurrentSeason();
  if (!season) {
    return profiles.map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url,
      xp: 0,
      level: 1,
    }));
  }

  const { data: levels } = await supabase
    .from("user_levels")
    .select("user_id, xp, level")
    .eq("season_id", season.id)
    .in(
      "user_id",
      profiles.map((p) => p.id),
    );

  const levelMap = new Map((levels ?? []).map((l) => [l.user_id, l]));

  return profiles.map((p) => {
    const level = levelMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url,
      xp: level?.xp ?? 0,
      level: level?.level ?? 1,
    };
  });
}
