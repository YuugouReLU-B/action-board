import { readTokenColor } from "@/lib/design/color-tokens";
import type { Database } from "@/lib/types/supabase";

export type PostingShapeStatus =
  Database["public"]["Enums"]["posting_shape_status"];

/**
 * ポリゴンのステータス別スタイル。
 *
 * Leaflet の PathOptions は SVG の presentation attribute になり `var()` が
 * 安定して解決されないため、ゲッターでアクセス時に実際の色へ解決する。
 * 定義元は src/app/globals.css の --app-posting-*。
 */
export const postingStatusConfig: Record<
  PostingShapeStatus,
  { label: string; color: string; fillColor: string; fillOpacity: number }
> = {
  planned: {
    label: "配布予定",
    get color() {
      return readTokenColor("--app-posting-planned");
    },
    get fillColor() {
      return readTokenColor("--app-posting-planned-fill");
    },
    fillOpacity: 0.4,
  },
  completed: {
    label: "配布完了",
    get color() {
      return readTokenColor("--app-posting-completed");
    },
    get fillColor() {
      return readTokenColor("--app-posting-completed-fill");
    },
    fillOpacity: 0.4,
  },
  unavailable: {
    label: "配布不可",
    get color() {
      return readTokenColor("--app-posting-unavailable");
    },
    get fillColor() {
      return readTokenColor("--app-posting-unavailable-fill");
    },
    fillOpacity: 0.4,
  },
  other: {
    label: "その他",
    get color() {
      return readTokenColor("--app-posting-other");
    },
    get fillColor() {
      return readTokenColor("--app-posting-other-fill");
    },
    fillOpacity: 0.4,
  },
};

export const postingStatusBadgeColors: Record<PostingShapeStatus, string> = {
  planned: "bg-blue-500",
  completed: "bg-green-500",
  unavailable: "bg-red-500",
  other: "bg-purple-500",
};

// クラスターアイコン用のステータス色
// SVG マークアップ内の fill / stroke 属性に埋め込むため解決済みの値を返す
export const postingStatusColors: Record<PostingShapeStatus, string> = {
  get planned() {
    return readTokenColor("--app-posting-planned");
  },
  get completed() {
    return readTokenColor("--app-posting-completed");
  },
  get unavailable() {
    return readTokenColor("--app-posting-unavailable");
  },
  get other() {
    return readTokenColor("--app-posting-other");
  },
};

// デフォルトのクラスタリングしきい値ズームレベル
// これ以上でポリゴン表示、未満でクラスター表示
export const CLUSTER_THRESHOLD_ZOOM = 13;

/**
 * 面積に応じたクラスタリング閾値ズームレベルを計算
 * 大きいshape → 低い閾値（広域でポリゴン表示）
 * 小さいshape → 高い閾値（ズームしてからポリゴン表示）
 *
 * @param areaM2 ポリゴンの面積（平方メートル）
 * @returns 閾値ズームレベル
 */
export function getClusterThresholdForArea(areaM2: number | null): number {
  if (!areaM2) return CLUSTER_THRESHOLD_ZOOM;

  // 面積による閾値の段階分け
  if (areaM2 >= 100_000_000) return 8; // 100km²以上: ズーム8からポリゴン
  if (areaM2 >= 10_000_000) return 10; // 10km²以上: ズーム10からポリゴン
  if (areaM2 >= 1_000_000) return 12; // 1km²以上: ズーム12からポリゴン
  return CLUSTER_THRESHOLD_ZOOM;
}

// ステータスラベル（ツールチップ等で使用）
export const postingStatusLabels: Record<PostingShapeStatus, string> = {
  planned: "配布予定",
  completed: "配布完了",
  unavailable: "配布不可",
  other: "その他",
};
