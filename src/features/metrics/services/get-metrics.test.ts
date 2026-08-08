import {
  fetchAchievementData,
  fetchRegistrationData,
} from "@/features/metrics/services/get-metrics";
import { createClient } from "@/lib/supabase/client";

jest.mock("@/lib/supabase/client");
jest.mock("@/features/metrics/services/get-metrics", () =>
  jest.requireActual("@/features/metrics/services/get-metrics"),
);

// Supabaseクライアントのモック設定
const setupMockSupabaseClient = (
  dataset: { created_at: string }[],
  capturedGteIsoRef: { value: string | null },
) => {
  (createClient as jest.Mock).mockReturnValue({
    from: () => ({
      select: () => ({
        count: dataset.length,
        gte: (_columnName: string, thresholdISO: string) => {
          capturedGteIsoRef.value = thresholdISO;
          const count = dataset.filter(
            (data) => new Date(data.created_at) >= new Date(thresholdISO),
          ).length;
          return Promise.resolve({ count });
        },
      }),
    }),
  });
};

describe("get-metrics", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const createDataset = (thresholdISO: string) => [
    { created_at: new Date(Date.parse(thresholdISO) - 1).toISOString() }, // 除外
    { created_at: thresholdISO }, // 含む
    { created_at: new Date(Date.parse(thresholdISO) + 1).toISOString() }, // 含む
  ];

  const setupTestEnvironment = (
    now: string,
    dataset: { created_at: string }[],
  ) => {
    const DAY = 24 * 60 * 60 * 1000; // ミリ秒
    jest.useFakeTimers().setSystemTime(new Date(now));

    const thresholdISO = new Date(Date.now() - DAY).toISOString();
    const capturedGteIsoRef = { value: null };

    setupMockSupabaseClient(dataset, capturedGteIsoRef);

    return { thresholdISO, capturedGteIsoRef };
  };

  describe("fetchAchievementData", () => {
    it("正常系: 24時間以内(created_at>=閾値)のみを集計する", async () => {
      const now = "2025-01-02T12:00:00Z";
      jest.useFakeTimers().setSystemTime(new Date(now));

      // 24時間前のISO8601形式の日時を計算
      const dataset = createDataset(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );
      const { thresholdISO, capturedGteIsoRef } = setupTestEnvironment(
        now,
        dataset,
      );

      const result = await fetchAchievementData();

      expect(result).toEqual({ totalCount: 3, todayCount: 2 });
      expect(capturedGteIsoRef.value).toBe(thresholdISO);

      jest.useRealTimers();
    });
  });

  describe("fetchRegistrationData", () => {
    it("正常系: 24時間以内(created_at>=閾値)のみを集計する", async () => {
      const now = "2025-01-02T12:00:00Z";
      jest.useFakeTimers().setSystemTime(new Date(now));

      // 24時間前のISO8601形式の日時を計算
      const dataset = createDataset(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );
      const { thresholdISO, capturedGteIsoRef } = setupTestEnvironment(
        now,
        dataset,
      );

      setupMockSupabaseClient(dataset, capturedGteIsoRef);

      const result = await fetchRegistrationData();

      expect(result).toEqual({ totalCount: 3, todayCount: 2 });
      expect(capturedGteIsoRef.value).toBe(thresholdISO);

      jest.useRealTimers();
    });
  });
});
