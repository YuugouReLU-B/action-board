import Link from "next/link";
import { notFound } from "next/navigation";
import { updateMission } from "@/features/admin/actions/mission-actions";
import { DuplicateMissionButton } from "@/features/admin/components/duplicate-mission-button";
import { MissionForm } from "@/features/admin/components/mission-form";
import { listCategoriesForAdmin } from "@/features/admin/services/admin-categories";
import { getMissionForAdmin } from "@/features/admin/services/admin-missions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ missionId: string }> };

export default async function EditMissionPage({ params }: PageProps) {
  const { missionId } = await params;
  const [mission, categories] = await Promise.all([
    getMissionForAdmin(missionId),
    listCategoriesForAdmin(),
  ]);

  if (!mission) {
    notFound();
  }

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

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold">内容</h3>
          <DuplicateMissionButton missionId={mission.id} />
        </div>
        <MissionForm
          mission={mission}
          categories={categories}
          selectedCategoryIds={mission.categoryIds}
          action={updateMission.bind(null, mission.id)}
          submitLabel="保存する"
        />
      </div>
    </section>
  );
}
