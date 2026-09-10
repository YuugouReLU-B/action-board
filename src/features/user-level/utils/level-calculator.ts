// L → L+1 の差分 XP
export const xpDelta = (L: number) => {
  if (L < 1) throw new Error("Level must be at least 1");
  return 40 + 15 * (L - 1);
};

// レベル L 到達までの累計 XP
export const totalXp = (L: number) => {
  if (L < 1) throw new Error("Level must be at least 1");
  return (L - 1) * (25 + (15 / 2) * L);
};

/**
 * XPに基づくレベル計算
 * 新しい式に基づく逆算
 */
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1;

  // 最大レベルを設定（計算の無限ループを防ぐため）
  const maxLevel = 1000;

  for (let level = 1; level <= maxLevel; level++) {
    const requiredXp = totalXp(level + 1);
    if (xp < requiredXp) {
      return level;
    }
  }

  return maxLevel;
}

/**
 * ミッション達成で付与するXPを計算する。
 *
 * 以前は difficulty(1-5) から段階的に導出していたため、ミッションごとに
 * 任意の値を設定できなかった。現在は `missions.points` をそのまま使う。
 * difficulty は★表示のためだけに残っている。
 *
 * 引数をミッション行そのものにしているのは、数値2つだと difficulty を
 * 渡しても型が通ってしまい、静かに誤ったXPが入るため。
 */
export function calculateMissionXp(mission: {
  points: number;
  is_featured?: boolean | null;
}): number {
  return mission.is_featured ? mission.points * 2 : mission.points;
}

/**
 * difficulty から既定のポイントを求める。
 *
 * 管理画面で新しいミッションを作るときの初期値に使う。
 * 既存ミッションの points もこの値で埋めてある（マイグレーション 20260809160000）。
 */
export function defaultPointsForDifficulty(difficulty: number): number {
  switch (difficulty) {
    case 1:
      return 50;
    case 2:
      return 100;
    case 3:
      return 200;
    case 4:
      return 400;
    case 5:
      return 800;
    default:
      return 50;
  }
}

/**
 * 次のレベルまでに必要なXP計算
 */
export function getXpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const nextLevelTotalXp = totalXp(currentLevel + 1);
  return Math.max(0, nextLevelTotalXp - currentXp);
}

/**
 * 現在レベルでの進捗率計算（0-1の値）
 */
export function getLevelProgress(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const xpToNext = getXpToNextLevel(currentXp);
  const levelXpRange = xpDelta(currentLevel);
  return Math.max(0, Math.min(1, (levelXpRange - xpToNext) / levelXpRange));
}
