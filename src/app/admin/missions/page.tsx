import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listMissionsForAdmin } from "@/features/admin/services/admin-missions";
import { ARTIFACT_TYPES, getArtifactConfig } from "@/lib/types/artifact-types";

export const dynamic = "force-dynamic";

export default async function AdminMissionsPage() {
  const missions = await listMissionsForAdmin();
  const visible = missions.filter((m) => !m.is_hidden);
  const qrSpots = missions.filter(
    (m) => m.required_artifact_type === ARTIFACT_TYPES.QR.key,
  );
  const qrWithoutCode = qrSpots.filter((m) => !m.qrCode);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-lg font-bold">ミッション</h2>
          <p className="text-sm text-gray-600">
            全 {missions.length} 件（公開中 {visible.length} / QRスポット{" "}
            {qrSpots.length}）
          </p>
        </div>
        <div className="flex gap-2">
          {qrSpots.length > 0 && (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/qr-sheets">QRシートを印刷</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/admin/missions/new">新しく作る</Link>
          </Button>
        </div>
      </div>

      {qrWithoutCode.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            QRコードが未発行のスポットが {qrWithoutCode.length} 件あります
          </p>
          <p className="mt-1 text-sm text-amber-800">
            発行するまで読み取っても獲得できません:{" "}
            {qrWithoutCode.map((m) => m.title).join(" / ")}
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-bold">タイトル</th>
              <th className="px-4 py-2.5 font-bold">達成の種類</th>
              <th className="px-4 py-2.5 text-right font-bold">ポイント</th>
              <th className="px-4 py-2.5 text-center font-bold">公開</th>
              <th className="px-4 py-2.5 text-center font-bold">QR</th>
              <th className="px-4 py-2.5 text-right font-bold">達成数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {missions.map((mission) => {
              const isQr =
                mission.required_artifact_type === ARTIFACT_TYPES.QR.key;
              return (
                <tr key={mission.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/missions/${mission.id}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {mission.title}
                    </Link>
                    <div className="font-mono text-xs text-gray-500">
                      {mission.slug}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {getArtifactConfig(mission.required_artifact_type)
                      ?.displayName ?? mission.required_artifact_type}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {mission.points}
                    {mission.is_featured && (
                      <span className="ml-1 text-xs text-amber-700">×2</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {mission.is_hidden ? (
                      <span className="text-gray-400">非公開</span>
                    ) : (
                      <span className="font-bold text-emerald-700">公開</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {!isQr ? (
                      <span className="text-gray-300">—</span>
                    ) : mission.qrCode ? (
                      <span className="font-bold text-emerald-700">発行済</span>
                    ) : (
                      <span className="font-bold text-amber-700">未発行</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                    {mission.achievementCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
