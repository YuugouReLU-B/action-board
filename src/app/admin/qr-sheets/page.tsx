import Link from "next/link";
import { PrintButton } from "@/features/admin/components/print-button";
import { QrSheet } from "@/features/admin/components/qr-sheet";
import { listMissionsForAdmin } from "@/features/admin/services/admin-missions";
import { buildQrUrl } from "@/features/qr-spot/services/qr-code";
import { calculateMissionXp } from "@/features/user-level/utils/level-calculator";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ missionId?: string }> };

export default async function QrSheetsPage({ searchParams }: PageProps) {
  const { missionId } = await searchParams;
  const missions = await listMissionsForAdmin();

  const qrSpots = missions.filter(
    (m) => m.required_artifact_type === ARTIFACT_TYPES.QR.key,
  );
  const target = missionId
    ? qrSpots.filter((m) => m.id === missionId)
    : qrSpots;

  const printable = target.filter((m) => m.qrCode);
  const withoutCode = target.filter((m) => !m.qrCode);

  return (
    <section>
      <div className="mb-6 print:hidden">
        <Link
          href="/admin/missions"
          className="text-sm text-gray-500 underline underline-offset-2"
        >
          ← ミッション一覧
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">QRシートの印刷</h2>
            <p className="mt-1 text-sm text-gray-600">
              {missionId ? "このスポット" : "QRスポット全件"}で{" "}
              {printable.length} 枚。1スポットにつき1枚で印刷されます。
            </p>
          </div>
          {printable.length > 0 && <PrintButton />}
        </div>

        <p className="mt-3 text-sm text-gray-600">
          印刷したQRを読み取れば誰でもポイントを獲得できます。
          <strong>掲示する場所以外に置かないでください。</strong>
        </p>

        {withoutCode.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">
              QRコードが未発行のため印刷できないスポットが {withoutCode.length}{" "}
              件あります
            </p>
            <ul className="mt-1 list-disc pl-5 text-sm text-amber-800">
              {withoutCode.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/admin/missions/${m.id}`}
                    className="underline underline-offset-2"
                  >
                    {m.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {printable.length === 0 ? (
        <p className="text-sm text-gray-600 print:hidden">
          印刷できるQRシートがありません。
          ミッションの編集画面でQRコードを発行してください。
        </p>
      ) : (
        <div className="space-y-6 print:space-y-0">
          {printable.map((mission) => (
            <QrSheet
              key={mission.id}
              title={mission.title}
              // 注目ミッションの2倍を反映した、実際に入る値を載せる
              points={calculateMissionXp(mission)}
              qrUrl={buildQrUrl(mission.qrCode as string)}
              slug={mission.slug}
            />
          ))}
        </div>
      )}
    </section>
  );
}
