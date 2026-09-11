import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  SINGLE_SPOT_ZOOM,
} from "@/features/spot-map/constants/map-view";
import {
  computeInitialView,
  computeSpotBounds,
} from "@/features/spot-map/utils/spot-bounds";

const spot = (latitude: number, longitude: number) => ({ latitude, longitude });

describe("computeSpotBounds", () => {
  it("複数のスポットを囲む枠を返す", () => {
    expect(
      computeSpotBounds([
        spot(37.5, 141.0),
        spot(37.1, 140.9),
        spot(37.3, 141.2),
      ]),
    ).toEqual({
      southWest: [37.1, 140.9],
      northEast: [37.5, 141.2],
    });
  });

  it("スポットが無ければ枠を作らない", () => {
    expect(computeSpotBounds([])).toBeNull();
  });

  it("1件だけなら枠を作らない", () => {
    expect(computeSpotBounds([spot(37.5, 141.0)])).toBeNull();
  });

  it("全部が同じ座標なら枠を作らない（潰れた枠で最大ズームまで寄るのを防ぐ）", () => {
    expect(
      computeSpotBounds([spot(37.5, 141.0), spot(37.5, 141.0)]),
    ).toBeNull();
  });

  it("緯度が同じで経度が違うなら枠になる", () => {
    expect(computeSpotBounds([spot(37.5, 141.0), spot(37.5, 141.2)])).toEqual({
      southWest: [37.5, 141.0],
      northEast: [37.5, 141.2],
    });
  });
});

describe("computeInitialView", () => {
  it("スポットが無ければ浜通りの既定位置を返す", () => {
    expect(computeInitialView([])).toEqual({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
  });

  it("1件ならそのスポットに寄せる", () => {
    expect(computeInitialView([spot(37.49, 141.0)])).toEqual({
      center: [37.49, 141.0],
      zoom: SINGLE_SPOT_ZOOM,
    });
  });
});
