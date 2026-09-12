import Image from "next/image";
import { redirect } from "next/navigation";
import Hero from "@/components/top/hero";
import { syncPointMilestoneAudience } from "@/features/line-notification/use-cases/sync-point-milestone-audience";
import { LotteryAnnouncementBanner } from "@/features/lottery/components/lottery-announcement-banner";
import FeaturedMissions from "@/features/missions/components/featured-missions";
import MissionsByCategory from "@/features/missions/components/missions-by-category";
import { hasFeaturedMissions } from "@/features/missions/services/missions";
import RankingSection from "@/features/ranking/components/ranking-section";
import { getUnnotifiedBadges } from "@/features/user-badges/services/get-unnotified-badges";
import { BadgeNotificationCheck } from "@/features/user-badges-notification/components/badge-notification-check";
import {
  getUser,
  hasPrivateProfile,
} from "@/features/user-profile/services/profile";
import { getCurrentSeasonId } from "@/lib/loaders/seasons-loaders";
import { createAdminClient } from "@/lib/supabase/adminClient";
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

  // バッジ通知をチェック
  let badgeNotifications = null;

  if (user) {
    const hasProfile = await hasPrivateProfile(user.id);
    if (!hasProfile) {
      redirect("/settings/profile?new=true");
    }

    // 現在のシーズンIDを取得
    const currentSeasonId = await getCurrentSeasonId();

    // バッジ通知をチェック（現在のシーズンのみ）
    const unnotifiedBadges = await getUnnotifiedBadges(
      user.id,
      currentSeasonId ?? undefined,
    );
    if (unnotifiedBadges.length > 0) {
      badgeNotifications = unnotifiedBadges;
    }

    // 累計ポイントが閾値に到達していればLINEオーディエンスへ追加（画面表示への影響なし）
    await syncPointMilestoneAudience(await createAdminClient(), user.id);
  }

  //フューチャードミッションの存在確認
  const showFeatured = await hasFeaturedMissions();

  return (
    <div className="flex flex-col min-h-screen w-full pt-2">
      {/* 抽選応募対象になったことのお知らせ */}
      <LotteryAnnouncementBanner />

      {/* バッジ通知 */}
      {badgeNotifications && (
        <BadgeNotificationCheck badgeData={badgeNotifications} />
      )}

      {/* ヒーローセクション */}
      <section className="relative">
        <Hero />
      </section>

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

      {/* ランキングセクション */}
      <section className="md:py-16 bg-background">
        <RankingSection />
      </section>

      <div className="w-full md:container md:mx-auto">
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
