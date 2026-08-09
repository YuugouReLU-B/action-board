import Link from "next/link";
import { notFound } from "next/navigation";
import { updateMission } from "@/features/admin/actions/mission-actions";
import { MissionForm } from "@/features/admin/components/mission-form";
import { QrCodePanel } from "@/features/admin/components/qr-code-panel";
import { getMissionForAdmin } from "@/features/admin/services/admin-missions";
import { buildQrUrl } from "@/features/qr-spot/services/qr-code";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ missionId: string }> };

export default async function EditMissionPage({ params }: PageProps) {
  const { missionId } = await params;
  const mission = await getMissionForAdmin(missionId);

  if (!mission) {
    notFound();
  }

  const isQrSpot = mission.required_artifact_type === ARTIFACT_TYPES.QR.key;

  return (
    <section className="space-y-8">
      <div>
        <Link
          href="/admin/missions"
          className="text-sm text-gray-500 underline underline-offset-2"
        >
          ← ミッション一覧
        </Link>
        <h2 className="mt-1 text-lg font-bold">{mission.title}</h2>
        <p className="mt-1 text-sm text-gray-600">
          達成 {mission.achievementCount} 件
          {mission.is_hidden ? " ・ 非公開" : " ・ 公開中"}
        </p>
      </div>

      {isQrSpot && (
        <div>
          <h3 className="mb-2 text-base font-bold">QRコード</h3>
          <QrCodePanel
            missionId={mission.id}
            missionTitle={mission.title}
            qrUrl={mission.qrCode ? buildQrUrl(mission.qrCode) : null}
          />
        </div>
      )}

      <div>
        <h3 className="mb-3 text-base font-bold">内容</h3>
        <MissionForm
          mission={mission}
          action={updateMission.bind(null, mission.id)}
          submitLabel="保存する"
        />
      </div>
    </section>
  );
}
