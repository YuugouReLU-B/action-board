/**
 * ユーザー詳細ページ
 *
 * このページは以下の機能を提供します：
 * - ユーザーの基本情報表示（ソーシャルリンク）
 * - クエスト達成状況の表示
 *
 * パフォーマンス最適化：
 * - Promise.allを使用した並列データ取得
 */
import { HeroBackdrop } from "@/components/top/hero-backdrop";
import { Card } from "@/components/ui/card";
import { LotteryEntryPanel } from "@/features/lottery/components/lottery-entry-panel";
import { AchievedMissionList } from "@/features/user-achievements/components/achieved-mission-list";
import { UserMissionAchievements } from "@/features/user-achievements/components/user-mission-achievements";
import {
  getUserAchievedMissions,
  getUserRepeatableMissionAchievements,
} from "@/features/user-achievements/loaders/achievements-loaders";
import { getUserActivityTimelineCount } from "@/features/user-activity/loaders/timeline-loaders";
import Levels from "@/features/user-level/components/levels";
import SocialBadgeSection from "@/features/user-profile/components/social-badge-section";
import { getProfile, getUser } from "@/features/user-profile/services/profile";
import { AccountDeletionSection } from "@/features/user-settings/components/account-deletion-section";
import ProfileForm from "@/features/user-settings/components/profile-form";
import { getCurrentSeasonId } from "@/lib/loaders/seasons-loaders";

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

  const [count, missionAchievements, achievedMissions] = await Promise.all([
    getUserActivityTimelineCount(id, currentSeasonId ?? undefined), // 活動総数（現在のシーズン）。クエスト達成状況セクションの表示判定にも使う
    getUserRepeatableMissionAchievements(id, currentSeasonId ?? undefined), // 繰り返し達成できるミッションの回数
    getUserAchievedMissions(id, currentSeasonId ?? undefined), // 達成したミッション（種別を問わず）
  ]);

  return (
    <div className="flex flex-col items-stretch w-full max-w-xl gap-4">
      {/* ユーザー情報表示（ホームと同じ浜通りの風景を背景に敷く） */}
      <section className="relative overflow-hidden rounded-2xl">
        <HeroBackdrop overlayClassName="bg-white/55" />
        <div className="relative z-10">
          <Levels
            userId={user.id}
            seasonId={currentSeasonId ?? undefined}
            transparent
          />
        </div>
      </section>

      <div className="px-4">
        {/* ソーシャルメディアリンク表示 */}
        <SocialBadgeSection
          x_username={user.x_username}
          github_username={user.github_username}
        />

        {/* クエスト達成状況セクション（活動がある場合のみ表示） */}
        {(count || 0) > 0 && (
          <Card className="w-full p-4 mt-4">
            <UserMissionAchievements
              achievements={missionAchievements}
              totalCount={count || 0}
            />
          </Card>
        )}

        {/* 達成したクエスト一覧（イベントのチェックインもここに並ぶ） */}
        {achievedMissions.length > 0 && (
          <Card className="w-full p-4 mt-4">
            <div className="mb-3 flex flex-row items-center justify-between">
              <span className="text-lg font-bold">達成したクエスト</span>
              <span className="text-sm text-gray-500">
                {achievedMissions.length} 件
              </span>
            </div>
            <AchievedMissionList missions={achievedMissions} />
          </Card>
        )}

        {/* アカウント設定セクション（自分のページを見ているときだけ表示） */}
        {isOwnPage && (
          <div className="mt-8 flex flex-col gap-4">
            <ProfileForm
              isNew={false}
              initialProfile={{
                name: user.name || undefined,
              }}
            />
            <LotteryEntryPanel />
            <AccountDeletionSection />
          </div>
        )}
      </div>
    </div>
  );
}
