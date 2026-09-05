import { Button } from "@/components/ui/button";
import { CopyTokenButton } from "@/features/lottery/components/copy-token-button";
import { generateLotteryToken } from "@/features/lottery/services/lottery-token";
import { getMyUserLevel } from "@/features/user-level/services/level";
import { getUser } from "@/features/user-profile/services/profile";
import {
  LOTTERY_FORM_URL,
  LOTTERY_THRESHOLD_POINTS,
} from "@/lib/constants/lottery-config";

/**
 * 抽選応募パネル。
 *
 * 累計ポイントがしきい値に達したユーザーにだけ応募トークンを表示する。
 * 応募の受付・当選確認・景品発送は外部フォーム（プレゼント事務局側の運用）
 * に委ねるため、ここではトークンの発行と案内だけを行う。
 */
export async function LotteryEntryPanel() {
  const user = await getUser();
  if (!user) return null;

  const userLevel = await getMyUserLevel();
  const points = userLevel?.xp ?? 0;
  const isEligible = points >= LOTTERY_THRESHOLD_POINTS;
  // シークレット未設定の環境では発行できないので、パネルごと出さない
  const token = isEligible ? generateLotteryToken(user.id) : null;
  if (isEligible && !token) return null;

  return (
    <div className="w-full max-w-md rounded-xl border-2 bg-white p-6">
      <p className="text-lg font-bold">プレゼント抽選応募</p>
      <p className="mt-1 text-sm text-gray-600">
        累計{LOTTERY_THRESHOLD_POINTS.toLocaleString()}
        ポイント以上で応募できます（現在{points.toLocaleString()}ポイント）。
      </p>

      {token ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-bold">あなたの応募トークン</p>
          <p className="rounded-md bg-gray-100 px-3 py-2 font-mono text-lg tracking-wider">
            {token}
          </p>
          <CopyTokenButton token={token} />
          {LOTTERY_FORM_URL && (
            <Button asChild className="mt-2 w-full">
              <a
                href={LOTTERY_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                応募フォームを開く
              </a>
            </Button>
          )}
          <p className="text-xs text-gray-500">
            応募フォームの回答欄にこのトークンを貼り付けてください。
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-600">
          あと{(LOTTERY_THRESHOLD_POINTS - points).toLocaleString()}
          ポイントで応募できます。
        </p>
      )}
    </div>
  );
}
