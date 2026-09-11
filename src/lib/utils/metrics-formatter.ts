/**
 * メトリクス表示用のフォーマット関数群
 */

/**
 * 更新日時を日本語形式でフォーマット（JST時刻で表示）
 * @param timestamp - ISO形式の日時文字列
 * @returns 日本語ロケールでフォーマットされた日時文字列（例: "2025/07/03 14:30"）
 */
export const formatUpdateTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
};

/**
 * 数値を日本語ロケールでフォーマット（カンマ区切り）
 * @param value - フォーマット対象の数値
 * @returns カンマ区切りでフォーマットされた文字列
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};
