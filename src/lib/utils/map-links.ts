/**
 * 外部の地図アプリへのリンク。
 *
 * 端末の標準の地図アプリ（iOSならマップ、AndroidならGoogleマップ）が
 * 開くように、緯度経度で検索するURLを組む。
 */
export function googleMapsSearchUrl(
  latitude: number,
  longitude: number,
): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
