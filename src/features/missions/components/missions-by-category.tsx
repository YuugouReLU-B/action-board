import {
  getMissionAchievementCounts,
  getMissionCategoryView,
  getPostingCountsForMissions,
} from "@/features/missions/loaders/missions-loaders";
import { getMissionDisplayCount } from "@/features/missions/utils/get-mission-display-count";
import { groupMissionsByCategory } from "@/features/missions/utils/group-missions-by-category";
import type { MapSpot } from "@/features/spot-map/services/spot-map";
import { getUserMissionAchievements } from "@/features/user-achievements/loaders/achievements-loaders";
import { calculateMissionXp } from "@/features/user-level/utils/level-calculator";
import { HorizontalScrollContainer } from "./horizontal-scroll-container";
import Mission from "./mission-card";
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
        <p className="text-gray-500 text-lg">
          ミッションが見つかりませんでした
        </p>
      </div>
    );
  }

  // カテゴリごとにグループ化・ソート・フィルタリング・変換（達成済みは常に含める。
  // 一覧モードでは末尾に回り、地図モードでは達成状況の色分けに使う）
  const categories = groupMissionsByCategory(data, userAchievementCountMap, {
    showAchievedMissions: true,
    achievedMissionIds,
  });

  // 地図モード用に、座標を持つミッションだけ抽出する
  const mapSpots: MapSpot[] = categories.flatMap((category) =>
    category.missions
      .filter((m) => m.latitude !== null && m.longitude !== null)
      .map((m) => ({
        id: m.id,
        slug: m.slug,
        title: m.title,
        points: calculateMissionXp(m),
        latitude: m.latitude as number,
        longitude: m.longitude as number,
        achieved: (userAchievementCountMap.get(m.id) ?? 0) > 0,
      })),
  );

  const listView = (
    <div className="flex flex-col gap-11">
      {categories.map((category) => (
        <section
          key={category.categoryId}
          className="
              relative               /* オーバーレイ配置のため */
              w-screen
              md:pl-10
            "
        >
          {/* カテゴリ見出し */}
          <h3 className="text-xl font-bold pl-4 md:pl-0">
            {category.categoryTitle}
          </h3>

          {/* 横スクロール領域 */}
          <HorizontalScrollContainer>
            <div className="flex w-fit gap-4 pl-4 md:pl-0 pr-4 pb-2 pt-4">
              {category.missions.map((mission) => (
                <div key={mission.id} className="shrink-0 w-[300px]">
                  <Mission
                    mission={mission}
                    achievementsCount={getMissionDisplayCount(
                      mission.id,
                      achievementCountMap,
                      postingCountMap,
                    )}
                    userAchievementCount={
                      userAchievementCountMap.get(mission.id) ?? 0
                    }
                  />
                </div>
              ))}
            </div>
          </HorizontalScrollContainer>
        </section>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-11">
      <MissionsViewToggle mapSpots={mapSpots}>{listView}</MissionsViewToggle>
    </div>
  );
}
