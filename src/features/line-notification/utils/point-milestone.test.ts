import { shouldSyncPointMilestoneAudience } from "./point-milestone";

describe("shouldSyncPointMilestoneAudience", () => {
  it("閾値未満の場合はfalse", () => {
    expect(shouldSyncPointMilestoneAudience(999, null)).toBe(false);
  });

  it("閾値ちょうどかつ未追加の場合はtrue", () => {
    expect(shouldSyncPointMilestoneAudience(1000, null)).toBe(true);
  });

  it("閾値超過かつ未追加の場合はtrue", () => {
    expect(shouldSyncPointMilestoneAudience(1500, null)).toBe(true);
  });

  it("閾値以上でも追加済みの場合はfalse", () => {
    expect(
      shouldSyncPointMilestoneAudience(1500, "2026-09-06T00:00:00.000Z"),
    ).toBe(false);
  });
});
