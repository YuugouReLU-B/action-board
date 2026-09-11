import Image from "next/image";
import { redirect } from "next/navigation";
import NoticeBoardAlert from "@/components/common/notice-board-alert";
import Hero from "@/components/top/hero";
import { PrefectureTeamCard } from "@/components/top/prefecture-team-card";
import FeaturedMissions from "@/features/missions/components/featured-missions";
import FirstMissions from "@/features/missions/components/first-missions";
import MissionsByCategory from "@/features/missions/components/missions-by-category";
import { hasFeaturedMissions } from "@/features/missions/services/missions";
import { getUnnotifiedBadges } from "@/features/user-badges/services/get-unnotified-badges";
import { BadgeNotificationCheck } from "@/features/user-badges-notification/components/badge-notification-check";
import { LevelUpCheck } from "@/features/user-level/components/level-up-check";
import { checkLevelUpNotification } from "@/features/user-level/loaders/level-up-loaders";
import {
  getUser,
  hasPrivateProfile,
} from "@/features/user-profile/services/profile";
import { getCurrentSeasonId } from "@/lib/loaders/seasons-loaders";
import { generateRootMetadata } from "@/lib/utils/metadata";

// メタデータ生成を外部関数に委譲
export const generateMetadata = generateRootMetadata;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const _referralCode = params.ref;

  const user = await getUser();

  // レベルアップ通知とバッジ通知をチェック
  let levelUpNotification = null;
  let badgeNotifications = null;

  if (user) {
    const hasProfile = await hasPrivateProfile(user.id);
    if (!hasProfile) {
      redirect("/settings/profile?new=true");
    }

    // 現在のシーズンIDを取得
    const currentSeasonId = await getCurrentSeasonId();

    // レベルアップ通知をチェック
    // 自動ミッション（紹介など）でレベルアップした場合の通知を表示するため有効化
    const levelUpCheck = await checkLevelUpNotification();
    if (levelUpCheck.shouldNotify && levelUpCheck.levelUp) {
      levelUpNotification = levelUpCheck.levelUp;
    }

    // バッジ通知をチェック（現在のシーズンのみ）
    const unnotifiedBadges = await getUnnotifiedBadges(
      user.id,
      currentSeasonId ?? undefined,
    );
    if (unnotifiedBadges.length > 0) {
      badgeNotifications = unnotifiedBadges;
    }
  }

  //フューチャードミッションの存在確認
  const showFeatured = await hasFeaturedMissions();

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* レベルアップ通知 */}
      {levelUpNotification && (
        <LevelUpCheck levelUpData={levelUpNotification} />
      )}

      {/* バッジ通知 */}
      {badgeNotifications && (
        <BadgeNotificationCheck badgeData={badgeNotifications} />
      )}

      {/* ヒーローセクション */}
      <section className="relative">
        <Hero />
      </section>
      {/* 注意書き */}
      <NoticeBoardAlert />

      {/* 都道府県対抗ランキング導線 */}
      {user != null && (
        <section className="py-4 md:py-8">
          <div className="w-full max-w-lg mx-auto px-4">
            <PrefectureTeamCard />
          </div>
        </section>
      )}

      {/* 参加方法の案内図（活動状況・タイムライン・ランキングの代わりに表示） */}
      <section className="py-12 md:py-16 bg-background">
        <div className="w-full max-w-4xl mx-auto px-4">
          <Image
            src="/img/how-to-participate.png"
            alt="参加方法：1. 浜通りクエストを開く 2. イベント参加・スポット訪問 3. その場でポイント獲得 4. 1000ポイントで景品応募"
            width={1672}
            height={941}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </section>

      <div className="w-full md:container md:mx-auto">
        {/* はじめのミッションセクション（すべて達成済みならセクションごと非表示） */}
        <FirstMissions userId={user?.id} />

        {/* フューチャードミッションセクション */}
        {showFeatured && (
          <section className="py-12 md:py-16 bg-background">
            <FeaturedMissions userId={user?.id} showAchievedMissions={true} />
          </section>
        )}

        {/* ミッションセクション */}
      </div>
      <section className="py-12 md:py-16 bg-background">
        <MissionsByCategory
          userId={user?.id}
          showAchievedMissions={true}
          id="missions"
        />
      </section>
    </div>
  );
}
