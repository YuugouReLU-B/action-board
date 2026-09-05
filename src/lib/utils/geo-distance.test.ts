import { calculateDistanceMeters } from "./geo-distance";

describe("calculateDistanceMeters", () => {
  test("同じ地点は0になる", () => {
    expect(calculateDistanceMeters(37.4917, 141.0, 37.4917, 141.0)).toBe(0);
  });

  test("緯度1度分はおよそ111kmになる", () => {
    const distance = calculateDistanceMeters(35.0, 139.0, 36.0, 139.0);
    expect(distance).toBeGreaterThan(110_000);
    expect(distance).toBeLessThan(112_000);
  });

  test("近接した2地点は数百m以内になる", () => {
    // 約0.003度 ≒ 300m前後
    const distance = calculateDistanceMeters(37.4917, 141.0, 37.4944, 141.0);
    expect(distance).toBeGreaterThan(250);
    expect(distance).toBeLessThan(350);
  });
});
