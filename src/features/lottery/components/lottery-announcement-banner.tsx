import Link from "next/link";
import { getMyUserLevel } from "@/features/user-level/services/level";
import { getUser } from "@/features/user-profile/services/profile";
import { LOTTERY_THRESHOLD_POINTS } from "@/lib/constants/lottery-config";

/**
 * 抽選応募の対象になったことをページ上部で知らせるバナー。
 *
 * しきい値未到達のユーザーには何も表示しない。応募自体の操作（トークン表示・
 * 外部フォームへの導線）は `LotteryEntryPanel`（マイページ）に委ねる。
 */
export async function LotteryAnnouncementBanner() {
  const user = await getUser();
  if (!user) return null;

  const userLevel = await getMyUserLevel();
  const points = userLevel?.xp ?? 0;
  if (points < LOTTERY_THRESHOLD_POINTS) return null;

  return (
    <div className="flex w-full justify-center bg-amber-100 text-amber-900">
      <Link
        href={`/users/${user.id}`}
        className="flex w-full max-w-4xl items-center justify-center gap-2 px-4 py-3 text-sm font-bold hover:underline"
      >
        🎉 累計{LOTTERY_THRESHOLD_POINTS.toLocaleString()}
        ポイント達成！プレゼント抽選に応募できます
      </Link>
    </div>
  );
}
