import { render, screen, waitFor } from "@testing-library/react";

// メトリクスサービスのモック
jest.mock("../services/get-metrics", () => ({
  fetchRegistrationData: jest.fn(),
  fetchAchievementData: jest.fn(),
}));

import {
  fetchAchievementData,
  fetchRegistrationData,
} from "@/features/metrics/services/get-metrics";
import { Metrics } from "./metrics-index";

// モック関数の型アサーション
const mockFetchRegistrationData = fetchRegistrationData as jest.MockedFunction<
  typeof fetchRegistrationData
>;
const mockFetchAchievementData = fetchAchievementData as jest.MockedFunction<
  typeof fetchAchievementData
>;

// テスト用のデフォルトデータ
const defaultRegistrationData = {
  totalCount: 75982,
  todayCount: 1710,
};

const defaultAchievementData = {
  totalCount: 18605,
  todayCount: 245,
};

jest.mock("@/components/ui/separator", () => ({
  Separator: ({ orientation, className }: any) => (
    <div
      data-testid="separator"
      data-orientation={orientation}
      className={className}
    />
  ),
}));

describe("Metrics", () => {
  beforeEach(() => {
    // 各テスト前にモックデータをリセット
    mockFetchRegistrationData.mockResolvedValue(defaultRegistrationData);
    mockFetchAchievementData.mockResolvedValue(defaultAchievementData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("基本的な表示", () => {
    it("メトリクスが正しくレンダリングされる", async () => {
      render(await Metrics());

      expect(
        screen.getByText("浜通りクエストの活動状況🚀"),
      ).toBeInTheDocument();
      expect(screen.getByText("登録者数")).toBeInTheDocument();
      expect(screen.getByText("達成アクション数")).toBeInTheDocument();
    });

    it("削除した項目は表示されない", async () => {
      render(await Metrics());

      expect(screen.queryByText("サポーター数")).not.toBeInTheDocument();
      expect(screen.queryByText("動画再生回数")).not.toBeInTheDocument();
      expect(screen.queryByText("動画本数")).not.toBeInTheDocument();
      expect(screen.queryByText("寄付金額")).not.toBeInTheDocument();
    });

    it("メトリクス数値が正しく表示される", async () => {
      render(await Metrics());

      await waitFor(() => {
        // 登録者数の確認
        expect(screen.getByText("75,982")).toBeInTheDocument();

        // 達成アクション数の確認
        expect(screen.getByText("18,605")).toBeInTheDocument();
      });
    });

    it("更新時刻が表示される", async () => {
      render(await Metrics());

      // 本番と同じ形式の日付フォーマット YYYY/MM/DD HH:MM 更新 の形式で検証
      expect(
        screen.getByText(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2} 更新/),
      ).toBeInTheDocument();
    });
  });

  describe("データ取得", () => {
    it("fetchRegistrationDataとfetchAchievementDataが正しく呼び出される", async () => {
      await Metrics();

      expect(mockFetchRegistrationData).toHaveBeenCalledTimes(1);
      expect(mockFetchAchievementData).toHaveBeenCalledTimes(1);
    });

    it("異なるデータでも正しく表示される", async () => {
      mockFetchRegistrationData.mockResolvedValueOnce({
        totalCount: 50000,
        todayCount: 1000,
      });

      render(await Metrics());

      await waitFor(() => {
        expect(screen.getByText("50,000")).toBeInTheDocument();
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("データ取得エラー時でも0件表示でレンダリングされる", async () => {
      mockFetchRegistrationData.mockRejectedValueOnce(new Error("DB Error"));
      mockFetchAchievementData.mockRejectedValueOnce(new Error("DB Error"));

      render(await Metrics());

      // 外部APIのフォールバック値は廃止したため、0件として表示される
      await waitFor(() => {
        expect(screen.getByText("登録者数")).toBeInTheDocument();
        expect(screen.getAllByText("0").length).toBeGreaterThan(0);
      });
    });
  });

  describe("レイアウト", () => {
    it("外部サービスへのリンクが残っていない", async () => {
      render(await Metrics());

      // Looker Studio（派生元のダッシュボード）へのリンクは削除済み
      expect(
        document.querySelector('a[href*="lookerstudio.google.com"]'),
      ).not.toBeInTheDocument();
    });

    it("アクション数ダッシュボードへの内部リンクが存在する", async () => {
      render(await Metrics());

      // アクション数セクションの/statsリンク
      const statsLink = document.querySelector('a[href="/stats"]');
      expect(statsLink).toBeInTheDocument();
      expect(statsLink).not.toHaveAttribute("target", "_blank");
    });

    it("メトリクスの順序が正しい", async () => {
      render(await Metrics());

      const metrics = screen.getAllByText(/登録者数|達成アクション数/);

      // 期待される順序: 登録者数 → 達成アクション数
      expect(metrics[0]).toHaveTextContent("登録者数");
      expect(metrics[1]).toHaveTextContent("達成アクション数");
    });
  });
});
