import "server-only";

import { createAdminClient } from "@/lib/supabase/adminClient";
import type { Tables } from "@/lib/types/supabase";

type Mission = Tables<"missions">;

export interface DevMissionRow
  extends Pick<
    Mission,
    | "id"
    | "slug"
    | "title"
    | "difficulty"
    | "required_artifact_type"
    | "max_achievement_count"
    | "is_featured"
    | "is_hidden"
    | "icon_url"
  > {
  /** 紐づくカテゴリ名 */
  categories: string[];
  /** 達成件数 */
  achievementCount: number;
}

/**
 * 開発用のミッション一覧。
 *
 * 通常のミッション一覧と違い、非公開（is_hidden）のものも含めて全件返す。
 * 表示専用なので集計もここで済ませる。
 */
export async function listMissionsForDevTools(): Promise<DevMissionRow[]> {
  const supabase = await createAdminClient();

  const [missionsResult, achievementsResult] = await Promise.all([
    supabase
      .from("missions")
      .select(
        `
        id,
        slug,
        title,
        difficulty,
        required_artifact_type,
        max_achievement_count,
        is_featured,
        is_hidden,
        icon_url,
        mission_category_link(
          mission_category(category_title)
        )
      `,
      )
      .order("difficulty", { ascending: true })
      .order("title", { ascending: true }),
    supabase.from("achievements").select("mission_id"),
  ]);

  if (missionsResult.error) {
    throw new Error(
      `ミッション一覧の取得に失敗しました: ${missionsResult.error.message}`,
    );
  }
  if (achievementsResult.error) {
    throw new Error(
      `達成件数の取得に失敗しました: ${achievementsResult.error.message}`,
    );
  }

  const achievementCounts = new Map<string, number>();
  for (const { mission_id } of achievementsResult.data ?? []) {
    if (!mission_id) continue;
    achievementCounts.set(
      mission_id,
      (achievementCounts.get(mission_id) ?? 0) + 1,
    );
  }

  return (missionsResult.data ?? []).map((mission) => {
    const { mission_category_link, ...rest } = mission;

    return {
      ...rest,
      categories: (mission_category_link ?? [])
        .map((link) => link.mission_category?.category_title)
        .filter((title): title is string => Boolean(title)),
      achievementCount: achievementCounts.get(mission.id) ?? 0,
    };
  });
}
