/**
 * メトリクス関連の型定義
 */

/**
 * アクション達成データの型定義
 * Supabaseから取得するアクション情報の構造を定義
 */
export interface AchievementData {
  totalCount: number; // 総アクション達成数
  todayCount: number; // 本日のアクション達成数
}

/**
 * ユーザー登録データの型定義
 * Supabaseから取得するユーザー登録情報の構造を定義
 */
export interface RegistrationData {
  totalCount: number; // 総ユーザー登録数
  todayCount: number; // 過去24時間のユーザー登録数
}
