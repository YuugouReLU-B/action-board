/**
 * 都道府県対抗ランキングの地図表示用色分けユーティリティ
 * 順位に応じて青系のグラデーションで色分けする
 *
 * 色の定義元は src/app/globals.css の --app-rank-scale-* / --app-rank-no-data。
 * Leaflet の PathOptions は SVG の presentation attribute になり `var()` が
 * 安定して解決されないため、値を解決してから渡す必要がある。
 */

import { readTokenColor } from "@/lib/design/color-tokens";

/** 濃い順に並んだ9段階の CSS 変数名 */
const RANK_SCALE_VARS = [
  "--app-rank-scale-1", // 1位〜5位: 最も濃い青
  "--app-rank-scale-2", // 6位〜10位
  "--app-rank-scale-3", // 11位〜15位
  "--app-rank-scale-4", // 16位〜20位
  "--app-rank-scale-5", // 21位〜25位
  "--app-rank-scale-6", // 26位〜30位
  "--app-rank-scale-7", // 31位〜35位
  "--app-rank-scale-8", // 36位〜40位
  "--app-rank-scale-9", // 41位〜47位: 最も薄い青
] as const;

const NO_DATA_VAR = "--app-rank-no-data";

const TOTAL_PREFECTURES = 47;
const COLORS_COUNT = RANK_SCALE_VARS.length;

/**
 * 順位に応じた色を返す（解決済みの値）
 * @param rank 順位（1〜47）
 * @returns 色コード（例: "#08306b"）
 */
export function getColorForRank(rank: number): string {
  if (rank < 1 || rank > TOTAL_PREFECTURES) {
    return readTokenColor(NO_DATA_VAR);
  }

  // 順位を色パレットのインデックスに変換
  const index = Math.floor(((rank - 1) / TOTAL_PREFECTURES) * COLORS_COUNT);

  return readTokenColor(RANK_SCALE_VARS[Math.min(index, COLORS_COUNT - 1)]);
}

/**
 * データがない都道府県用のグレー色（解決済みの値）
 */
export function getNoDataColor(): string {
  return readTokenColor(NO_DATA_VAR);
}

/**
 * 凡例用の色パレット情報。
 * CSS で扱える箇所（style 属性など）向けに `var()` 参照のまま返す。
 */
export const LEGEND_COLORS = RANK_SCALE_VARS.map((cssVar, index) => ({
  cssVar,
  color: `var(${cssVar})`,
  label:
    index === 0
      ? "1位〜"
      : index === COLORS_COUNT - 1
        ? `${Math.floor((TOTAL_PREFECTURES / COLORS_COUNT) * index) + 1}位〜`
        : "",
}));
