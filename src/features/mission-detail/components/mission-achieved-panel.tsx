import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type MissionAchievedPanelProps = {
  /** シェア導線などで使うためのslug。今は使わないが将来の拡張用に受ける */
  missionSlug?: string;
};

/**
 * 達成済みミッションの完了表示。
 *
 * 提出物のないミッション（公式LINE友だち追加など）で、達成後も
 * 「友だち追加する」ボタンを出し続けると、下に並ぶ達成履歴と矛盾して
 * 何をすればよいのか分からなくなる。達成済みだと分かる表示に切り替える。
 */
export function MissionAchievedPanel({
  missionSlug: _missionSlug,
}: MissionAchievedPanelProps) {
  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
      <CheckCircle2
        className="mx-auto mb-2 h-10 w-10 text-emerald-600"
        aria-hidden="true"
      />
      <p className="text-lg font-bold text-emerald-900">達成しました！</p>
      <p className="mt-1 text-sm text-emerald-800">
        このミッションはクリア済みです。
      </p>
      <Button asChild className="mt-4">
        <Link href="/">ほかのミッションを見る</Link>
      </Button>
    </div>
  );
}
