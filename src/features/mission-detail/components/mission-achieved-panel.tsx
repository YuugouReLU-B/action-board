import type { ReactNode } from "react";
import { QuestClearPanel } from "@/features/mission-detail/components/quest-clear-panel";

type MissionAchievedPanelProps = {
  /** シェア導線などで使うためのslug。今は使わないが将来の拡張用に受ける */
  missionSlug?: string;
  /** このクエストの獲得ポイント */
  points: number;
  /** 現在の合計ポイント */
  totalPoints: number;
  /** サーバーコンポーネントの<LotteryProgressBar />をそのまま渡す */
  lotteryProgress: ReactNode;
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
  points,
  totalPoints,
  lotteryProgress,
}: MissionAchievedPanelProps) {
  return (
    <div className="space-y-4">
      <QuestClearPanel
        earnedPoints={points}
        totalPoints={totalPoints}
        note="このクエストはクリア済みです。"
      />
      {lotteryProgress}
    </div>
  );
}
