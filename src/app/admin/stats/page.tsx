import { redirect } from "next/navigation";
import { MetricsWithSuspense } from "@/features/metrics/components/metrics-with-suspense";
import RankingSection from "@/features/ranking/components/ranking-section";
import Activities from "@/features/user-activity/components/activities";
import { getUser } from "@/features/user-profile/services/profile";
import { isAdmin } from "@/lib/utils/admin";

export default async function AdminStatsPage() {
  const user = await getUser();

  if (!isAdmin(user)) {
    redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <h1 className="text-2xl font-bold text-center mt-8">
        活動状況（管理者用）
      </h1>

      {/* メトリクスセクション */}
      <MetricsWithSuspense />

      {/* アクティビティセクション */}
      <section className="py-12 md:py-16 bg-background">
        <Activities />
      </section>

      {/* ランキングセクション */}
      <section className="md:py-16 bg-background">
        <RankingSection />
      </section>
    </div>
  );
}
