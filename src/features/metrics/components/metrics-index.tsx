import { Separator } from "@/components/ui/separator";
import {
  fetchAchievementData,
  fetchRegistrationData,
} from "@/features/metrics/loaders/metrics-loaders";
import type {
  AchievementData,
  RegistrationData,
} from "@/features/metrics/types/metrics-types";
import { formatUpdateTime } from "@/lib/utils/metrics-formatter";
import { AchievementMetric } from "./achievement-metric";
import { MetricsLayout } from "./metrics-layout";
import { RegistrationMetric } from "./registration-metric";

export { MetricsErrorBoundary } from "./metrics-error-boundary";
export { MetricsWithSuspense } from "./metrics-with-suspense";

/**
 * メトリクス表示コンポーネント
 *
 * 浜通りクエストの活動状況を表示するメインコンポーネント
 * 以下のデータを統合して表示：
 * 1. 登録者数（Supabase）
 * 2. アクション達成数（Supabase、今年のデータのみ）
 *
 * どちらも自前DBの集計であり、外部APIには依存しない。
 */
export async function Metrics() {
  // 今年の1月1日以降のデータのみ取得
  const thisYear = new Date().getFullYear();
  const startOfYear = new Date(`${thisYear}-01-01`);

  // 登録者数とアクション数を取得
  let registrationData: RegistrationData | null = null;
  let achievementData: AchievementData | null = null;
  try {
    [registrationData, achievementData] = await Promise.all([
      fetchRegistrationData(),
      fetchAchievementData(startOfYear),
    ]);
  } catch (error) {
    console.error("Failed to fetch metrics data:", error);
  }

  // 自前DBのリアルタイム集計のため、描画時刻をそのまま更新時刻として表示する
  const lastUpdated = formatUpdateTime(new Date().toISOString());

  return (
    <MetricsLayout title="浜通りクエストの活動状況🚀" lastUpdated={lastUpdated}>
      {/* 登録者数 */}
      <RegistrationMetric data={registrationData} />

      {/* 水平セパレーター */}
      <Separator orientation="horizontal" className="my-4" />

      {/* アクション達成数（今年のデータのみ） */}
      <AchievementMetric data={achievementData} startDate={startOfYear} />
    </MetricsLayout>
  );
}
