/**
 * 抽選応募のしきい値。
 *
 * この累計ポイント（現在のアクティブシーズンのXP）以上でトークンが
 * 表示され、外部フォームへの応募が可能になる。
 */
export const LOTTERY_THRESHOLD_POINTS = 1000;

/**
 * 応募先の外部フォーム（Googleフォーム等）のURL。
 *
 * 抽選応募・当選確認・景品発送はプレゼント事務局側の運用（外部フォーム）
 * に委ね、このアプリはトークンの発行と表示だけを担う。
 * 未設定の間はリンクを出さない。
 */
export const LOTTERY_FORM_URL = process.env.NEXT_PUBLIC_LOTTERY_FORM_URL || "";
