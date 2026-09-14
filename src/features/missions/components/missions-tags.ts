import type { MissionForComponent } from "@/features/missions/utils/group-missions-by-category";
import type { Tables } from "@/lib/types/supabase";

export type TaggedMission = {
  mission: Tables<"missions">;
  userAchievementCount: number;
  achieved: boolean;
  /** 常設クエスト / 特設クエスト（category_kbn由来） */
  questType: string;
  /** イベント / プレイヤー / SNS（カテゴリ名由来） */
  kind: string;
  /** 浜通り / 東京（ミッション名に「東京」を含むかどうかで判定） */
  region: string;
};

const QUEST_TYPE_LABELS: Record<string, string> = {
  PERMANENT: "常設クエスト",
  SPECIAL: "特設クエスト",
};

// カテゴリ名から短いタグ表記に変換する。
// 新しいカテゴリを追加したときは、必要に応じてここにも追記する
const KIND_LABELS: Record<string, string> = {
  公式LINE登録をしよう: "SNS",
  プレイヤーを訪問しよう: "プレイヤー",
  イベントに参加しよう: "イベント",
};

const TOKYO_KEYWORD = "東京";

export function getQuestTypeLabel(categoryKbn: string): string {
  return QUEST_TYPE_LABELS[categoryKbn] ?? "その他";
}

export function getKindLabel(categoryTitle: string): string {
  return KIND_LABELS[categoryTitle] ?? categoryTitle;
}

export function getRegionLabel(missionTitle: string): string {
  return missionTitle.includes(TOKYO_KEYWORD) ? "東京" : "浜通り";
}

export function toTaggedMission(
  mission: MissionForComponent,
  category: { categoryKbn: string; categoryTitle: string },
  userAchievementCount: number,
): TaggedMission {
  return {
    mission,
    userAchievementCount,
    achieved: userAchievementCount > 0,
    questType: getQuestTypeLabel(category.categoryKbn),
    kind: getKindLabel(category.categoryTitle),
    region: getRegionLabel(mission.title),
  };
}
