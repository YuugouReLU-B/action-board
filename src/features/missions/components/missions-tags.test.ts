import type { Tables } from "@/lib/types/supabase";
import { toTaggedMission } from "./missions-tags";

describe("toTaggedMission", () => {
  it.each([
    ["SPECIAL_TOKYO", "東京", "特設クエスト"],
    ["SPECIAL_HAMADORI", "浜通り", "特設クエスト"],
    ["PERMANENT", "浜通り", "常設クエスト"],
    ["SNS", "", "SNS登録"],
  ])("%sを正式フィールドで分類する", (questCategory, region, questType) => {
    const mission = {
      id: "m1",
      title: "東京という文字を含むタイトル",
      quest_category: questCategory,
      event_category: null,
    } as Tables<"missions">;
    expect(toTaggedMission(mission, 2)).toMatchObject({
      region,
      questType,
      achieved: true,
      userAchievementCount: 2,
    });
  });
});
