import { EVENT_CATEGORY_LABELS } from "@/features/missions/constants/quest-categories";
import type { Tables } from "@/lib/types/supabase";

export type TaggedMission = {
  mission: Tables<"missions">;
  userAchievementCount: number;
  achieved: boolean;
  /** quest_category由来 */
  questType: string;
  /** event_categoryまたはSNS分類由来 */
  kind: string;
  /** quest_category由来。SNS登録は地域を持たない */
  region: string;
};

export function toTaggedMission(
  mission: Tables<"missions">,
  userAchievementCount: number,
): TaggedMission {
  const special =
    mission.quest_category === "SPECIAL_HAMADORI" ||
    mission.quest_category === "SPECIAL_TOKYO";
  return {
    mission,
    userAchievementCount,
    achieved: userAchievementCount > 0,
    questType: special
      ? "特設クエスト"
      : mission.quest_category === "SNS"
        ? "SNS登録"
        : "常設クエスト",
    kind:
      mission.quest_category === "SNS"
        ? "SNS"
        : mission.event_category
          ? EVENT_CATEGORY_LABELS[mission.event_category]
          : "",
    region:
      mission.quest_category === "SNS"
        ? ""
        : mission.quest_category === "SPECIAL_TOKYO"
          ? "東京"
          : "浜通り",
  };
}
