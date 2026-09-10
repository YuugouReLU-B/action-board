/**
 * ユーザー詳細ページ
 *
 * このページは以下の機能を提供します：
 * - ユーザーの基本情報表示（ソーシャルリンク）
 * - ミッション達成状況の表示
 * - 活動タイムラインの表示（ページネーション付き）
 *
 * パフォーマンス最適化：
 * - Promise.allを使用した並列データ取得
 * - 初期データをクライアントコンポーネントに渡してSSR最適化
 */
import { Card } from "@/components/ui/card";
import { LotteryEntryPanel } from "@/features/lottery/components/lottery-entry-panel";
import { AchievedMissionList } from "@/features/user-achievements/components/achieved-mission-list";
import { UserMissionAchievements } from "@/features/user-achievements/components/user-mission-achievements";
import {
  getUserAchievedMissions,
  getUserRepeatableMissionAchievements,
} from "@/features/user-achievements/loaders/achievements-loaders";
import UserDetailActivities from "@/features/user-activity/components/user-detail-activities";
import {
  getUserActivityTimeline,
  getUserActivityTimelineCount,
} from "@/features/user-activity/loaders/timeline-loaders";
import Levels from "@/features/user-level/components/levels";
import SocialBadgeSection from "@/features/user-profile/components/social-badge-section";
import { getProfile, getUser } from "@/features/user-profile/services/profile";
import { UserSeasonHistory } from "@/features/user-season/components/user-season-history";
import { AccountDeletionSection } from "@/features/user-settings/components/account-deletion-section";
import ProfileForm from "@/features/user-settings/components/profile-form";
import {
  getCurrentSeasonId,
  getUserSeasonHistory,
} from "@/lib/loaders/seasons-loaders";

/** 活動タイムラインの1ページあたりの表示件数 */
const PAGE_SIZE = 20;

type Params = {
  id: string;
};

type Props = {
  params: Promise<Params>;
};

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;

  const user = await getProfile(id);

  if (!user) return <div>ユーザーが見つかりません</div>;

  // 自分自身のページかどうか（アカウント設定セクションの表示判定に使う）
  const viewer = await getUser();
  const isOwnPage = viewer?.id === id;

  // 現在のシーズンIDを取得
  const currentSeasonId = await getCurrentSeasonId();

  const [
    timeline,
    count,
    missionAchievements,
    achievedMissions,
    seasonHistory,
  ] = await Promise.all([
    getUserActivityTimeline(id, PAGE_SIZE, 0, currentSeasonId ?? undefined), // 初期の活動タイムライン（現在のシーズン）
    getUserActivityTimelineCount(id, currentSeasonId ?? undefined), // 活動総数（現在のシーズン）
    getUserRepeatableMissionAchievements(id, currentSeasonId ?? undefined), // 繰り返し達成できるミッションの回数
    getUserAchievedMissions(id, currentSeasonId ?? undefined), // 達成したミッション（種別を問わず）
    getUserSeasonHistory(id), // シーズン履歴
  ]);

  return (
    <div className="flex flex-col items-stretch w-full max-w-xl gap-4">
      {/* ユーザー情報表示 */}
      <Levels userId={user.id} seasonId={currentSeasonId ?? undefined} />

      <div className="px-4">
        {/* ソーシャルメディアリンク表示 */}
        <SocialBadgeSection
          x_username={user.x_username}
          github_username={user.github_username}
        />

        {/* ミッション達成状況セクション（活動がある場合のみ表示） */}
        {(count || 0) > 0 && (
          <Card className="w-full p-4 mt-4">
            <UserMissionAchievements
              achievements={missionAchievements}
              totalCount={count || 0}
            />
          </Card>
        )}

        {/* 達成したミッション一覧（イベントのチェックインもここに並ぶ） */}
        {achievedMissions.length > 0 && (
          <Card className="w-full p-4 mt-4">
            <div className="mb-3 flex flex-row items-center justify-between">
              <span className="text-lg font-bold">達成したミッション</span>
              <span className="text-sm text-gray-500">
                {achievedMissions.length} 件
              </span>
            </div>
            <AchievedMissionList missions={achievedMissions} />
          </Card>
        )}

        {/* 活動タイムラインセクション */}
        <Card className="w-full p-4 mt-4">
          <div className="flex flex-row justify-between items-center mb-2">
            <span className="text-lg font-bold">活動タイムライン</span>
          </div>
          {/* クライアントサイドページネーション付きの活動タイムライン */}
          <UserDetailActivities
            userId={id}
            initialTimeline={timeline}
            pageSize={PAGE_SIZE}
            totalCount={count}
            seasonId={currentSeasonId ?? undefined}
          />
        </Card>

        {/* シーズン履歴セクション */}
        {seasonHistory.length > 0 && (
          <Card className="w-full p-4 mt-4">
            <h3 className="text-lg font-bold mb-4">シーズン履歴</h3>
            <UserSeasonHistory userId={user.id} seasonHistory={seasonHistory} />
          </Card>
        )}

        {/* アカウント設定セクション（自分のページを見ているときだけ表示） */}
        {isOwnPage && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <ProfileForm
              isNew={false}
              initialProfile={{
                name: user.name || undefined,
                avatar_url: user.avatar_url || null,
              }}
            />
            <div className="w-full max-w-md">
              <LotteryEntryPanel />
            </div>
            <AccountDeletionSection />
          </div>
        )}
      </div>
    </div>
  );
}
