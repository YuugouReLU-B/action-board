import Link from "next/link";
import { createMission } from "@/features/admin/actions/mission-actions";
import { MissionForm } from "@/features/admin/components/mission-form";

export const dynamic = "force-dynamic";

export default function NewMissionPage() {
  return (
    <section>
      <div className="mb-4">
        <Link
          href="/admin/missions"
          className="text-sm text-gray-500 underline underline-offset-2"
        >
          ← ミッション一覧
        </Link>
        <h2 className="mt-1 text-lg font-bold">ミッションを作る</h2>
        <p className="mt-1 text-sm text-gray-600">
          作成直後は非公開です。内容を確認してから公開に切り替えてください。
          QRスポットの場合は、作成後の画面でQRコードを発行します。
        </p>
      </div>

      <MissionForm action={createMission} submitLabel="作成する" />
    </section>
  );
}
