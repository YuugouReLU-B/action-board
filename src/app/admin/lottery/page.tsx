import { LotterySettingsForm } from "@/features/admin/components/lottery-settings-form";
import { getLotterySettings } from "@/features/lottery/services/lottery-settings";

export const dynamic = "force-dynamic";

export default async function AdminLotteryPage() {
  const settings = await getLotterySettings();

  if (!settings) {
    return (
      <p className="text-sm text-red-600">
        設定の取得に失敗しました。時間をおいて再度お試しください。
      </p>
    );
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold">抽選応募設定</h2>
        <p className="text-sm text-gray-600">
          マイページに表示する「プレゼント抽選応募」パネルの、表示条件と文言を編集する。
        </p>
      </div>

      <LotterySettingsForm settings={settings} />
    </section>
  );
}
