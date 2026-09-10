/** スポットが1件も無いときの初期表示。浜通りのだいたい中央 */
export const DEFAULT_CENTER: [number, number] = [37.4, 141.0];
export const DEFAULT_ZOOM = 10;

/** スポットが1件だけのとき。囲む枠が作れないので固定のズームで寄せる */
export const SINGLE_SPOT_ZOOM = 15;

export const MAX_ZOOM = 18;

/**
 * 地図タイル。国土地理院のものを使う。
 *
 * `tile.openstreetmap.org` は本番利用を推奨されていないので使わない。
 * 地理院タイルは出典表示をすれば申請なしで使える。
 * https://maps.gsi.go.jp/development/ichiran.html
 */
export const TILE_URL =
  "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">国土地理院</a>';

/** 全スポットを収めたあと、端のピンが画面際に来ないように空ける余白 */
export const FIT_BOUNDS_PADDING = 48;
