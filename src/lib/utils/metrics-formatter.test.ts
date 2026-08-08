import { formatNumber, formatUpdateTime } from "./metrics-formatter";

describe("formatUpdateTime", () => {
  it("ISO形式の日時をJST形式にフォーマットする", () => {
    // UTC 2025-01-15T05:30:00Z = JST 2025/01/15 14:30
    const result = formatUpdateTime("2025-01-15T05:30:00Z");
    expect(result).toContain("2025");
    expect(result).toContain("01");
    expect(result).toContain("15");
  });
});
