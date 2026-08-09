/**
 * 地図の初期表示位置の計算。Leaflet に依存させないでテストできるようにしている。
 */

import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  SINGLE_SPOT_ZOOM,
} from "@/features/spot-map/constants/map-view";

export type LatLng = { latitude: number; longitude: number };

export type SpotBounds = {
  southWest: [number, number];
  northEast: [number, number];
};

/** 全スポットを囲む枠。2件以上ないと枠にならないので null を返す */
export function computeSpotBounds(spots: readonly LatLng[]): SpotBounds | null {
  if (spots.length < 2) return null;

  const lats = spots.map((s) => s.latitude);
  const lngs = spots.map((s) => s.longitude);

  const southWest: [number, number] = [Math.min(...lats), Math.min(...lngs)];
  const northEast: [number, number] = [Math.max(...lats), Math.max(...lngs)];

  // 全部が同じ座標だと枠が潰れて、Leaflet が最大ズームまで寄ってしまう
  if (southWest[0] === northEast[0] && southWest[1] === northEast[1]) {
    return null;
  }

  return { southWest, northEast };
}

/** 枠が作れないときの中心とズーム。1件ならそのスポットに寄せる */
export function computeInitialView(spots: readonly LatLng[]): {
  center: [number, number];
  zoom: number;
} {
  const first = spots[0];
  if (!first) return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };

  return {
    center: [first.latitude, first.longitude],
    zoom: SINGLE_SPOT_ZOOM,
  };
}
