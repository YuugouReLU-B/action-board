import {
  getMissionAchievementCounts,
  getMissionCategoryView,
  getPostingCountsForMissions,
} from "@/features/missions/loaders/missions-loaders";
import { getMissionDisplayCount } from "@/features/missions/utils/get-mission-display-count";
import { groupMissionsByCategory } from "@/features/missions/utils/group-missions-by-category";
import { getUserMissionAchievements } from "@/features/user-achievements/loaders/achievements-loaders";
import { toTaggedMission } from "./missions-tags";
import { MissionsViewToggle } from "./missions-view-toggle";

type MissionsByCategoryProps = {
  userId?: string;
};

export default async function MissionsByCategory({
  userId,
}: MissionsByCategoryProps) {
  // ユーザーの各ミッションに対する達成回数のマップ
  const userAchievementCountMap = userId
    ? await getUserMissionAchievements(userId)
    : new Map<string, number>();

  // ユーザーが達成したミッションIDのリスト
  const achievedMissionIds = Array.from(userAchievementCountMap.keys());

  // 全体の達成数取得
  const achievementCountMap = await getMissionAchievementCounts();

  // View からミッションデータ取得
  const data = await getMissionCategoryView();

  // ポスティングミッションの合計枚数を取得
  const missionsForPostingCount = data
    .filter((m) => m.mission_id)
    .map((m) => ({
      id: m.mission_id as string,
      required_artifact_type: m.required_artifact_type,
    }));
  const postingCountMap = await getPostingCountsForMissions(
    missionsForPostingCount,
  );

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">クエストが見つかりませんでした</p>
      </div>
    );
  }

  // カテゴリごとにグループ化・ソート・フィルタリング・変換（達成済みは常に含める。
  // 一覧モードでは末尾に回り、地図モードでは達成状況の色分けに使う）
  const categories = groupMissionsByCategory(data, userAchievementCountMap, {
    showAchievedMissions: true,
    achievedMissionIds,
  });

  // カテゴリの区切りをやめて、全ミッションをタグ付きのフラットな一覧にする
  // （常設/特設・イベント/プレイヤー/SNS・浜通り/東京で絞り込める）
  const taggedMissions = categories.flatMap((category) =>
    category.missions.map((mission) =>
      toTaggedMission(
        mission,
        category,
        getMissionDisplayCount(
          mission.id,
          achievementCountMap,
          postingCountMap,
        ),
        userAchievementCountMap.get(mission.id) ?? 0,
      ),
    ),
  );

  // 地図モード用に、座標を持つミッションだけ抽出する
  const mapMissions = taggedMissions.filter(
    (m) => m.mission.latitude !== null && m.mission.longitude !== null,
  );

  // カレンダーモード用に、特設クエストのうち開催日を持つミッションを抽出する
  const calendarMissions = taggedMissions.filter(
    (m) => m.questType === "特設クエスト" && m.mission.event_date,
  );

  return (
    <div className="flex flex-col gap-11">
      <MissionsViewToggle
        listMissions={taggedMissions}
        mapMissions={mapMissions}
        calendarMissions={calendarMissions}
      />
    </div>
  );
}
