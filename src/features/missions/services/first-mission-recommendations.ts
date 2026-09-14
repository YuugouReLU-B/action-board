import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/types/supabase";

export type RecommendedMission = Tables<"missions">;

export type FirstMissionRecommendations = {
  events: RecommendedMission[];
  spots: RecommendedMission[];
};

const RECOMMENDATION_LIMIT = 3;

/**
 * 初回クエストクリア画面向けに、開催が近いイベントとおすすめのスポットを
 * それぞれ最大3件ずつ返す。
 *
 * 達成済みのミッションは候補から除く。
 */
export async function getFirstMissionRecommendations(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FirstMissionRecommendations> {
  const { data: achievements } = await supabase
    .from("achievements")
    .select("mission_id")
    .eq("user_id", userId);
  const achievedIds = new Set(
    (achievements ?? []).flatMap((a) => (a.mission_id ? [a.mission_id] : [])),
  );

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: events }, { data: spots }] = await Promise.all([
    supabase
      .from("missions")
      .select("*")
      .eq("is_hidden", false)
      .not("event_date", "is", null)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(RECOMMENDATION_LIMIT + achievedIds.size),
    supabase
      .from("missions")
      .select("*")
      .eq("is_hidden", false)
      .eq("event_category", "SPOT")
      .order("is_featured", { ascending: false })
      .limit(RECOMMENDATION_LIMIT + achievedIds.size),
  ]);

  return {
    events: (events ?? [])
      .filter((m) => !achievedIds.has(m.id))
      .slice(0, RECOMMENDATION_LIMIT),
    spots: (spots ?? [])
      .filter((m) => !achievedIds.has(m.id))
      .slice(0, RECOMMENDATION_LIMIT),
  };
}
