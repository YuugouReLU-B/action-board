/** DATE型の開始日は日本時間の0時を境界とする。未設定なら日付制限なし。 */
export function hasLotteryStarted(
  eligibleDisplayFrom: string | null,
  now: Date = new Date(),
): boolean {
  return (
    eligibleDisplayFrom === null ||
    now.getTime() >= new Date(`${eligibleDisplayFrom}T00:00:00+09:00`).getTime()
  );
}
