import { POINT_MILESTONE_THRESHOLD } from "../constants/point-milestone";

/**
 * 累計ポイントが閾値に到達していて、まだLINEオーディエンスへ追加していないかを判定する。
 */
export function shouldSyncPointMilestoneAudience(
  xp: number,
  audienceAddedAt: string | null,
): boolean {
  return xp >= POINT_MILESTONE_THRESHOLD && audienceAddedAt === null;
}
