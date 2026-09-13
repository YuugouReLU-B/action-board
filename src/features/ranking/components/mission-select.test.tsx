import { fireEvent, render, screen } from "@testing-library/react";
import { MissionSelect } from "./mission-select";

const mockPush = jest.fn();
const _mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/ranking/ranking-mission",
}));

jest.mock("lucide-react", () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <div className={className} data-testid="chevron-down" />
  ),
}));

const mockMissions = [
  {
    id: "mission-1",
    title: "テストクエスト1",
    description: "テスト用のクエスト1",
  },
  {
    id: "mission-2",
    title: "テストクエスト2",
    description: "テスト用のクエスト2",
  },
  {
    id: "mission-3",
    title: "テストクエスト3",
    description: "テスト用のクエスト3",
  },
] as any;

describe("MissionSelect", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe("基本的な表示", () => {
    it("ラベルが正しく表示される", () => {
      render(<MissionSelect missions={mockMissions} />);

      expect(screen.getByText("クエストを選択")).toBeInTheDocument();
    });

    it("セレクトボックスが表示される", () => {
      render(<MissionSelect missions={mockMissions} />);

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute("id", "mission-select");
    });

    it("ChevronDownアイコンが表示される", () => {
      render(<MissionSelect missions={mockMissions} />);

      expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
    });

    it("すべてのクエストオプションが表示される", () => {
      render(<MissionSelect missions={mockMissions} />);

      expect(screen.getByText("テストクエスト1")).toBeInTheDocument();
      expect(screen.getByText("テストクエスト2")).toBeInTheDocument();
      expect(screen.getByText("テストクエスト3")).toBeInTheDocument();
    });
  });

  describe("初期値の設定", () => {
    it("URLパラメータがない場合は最初のクエストが選択される", () => {
      render(<MissionSelect missions={mockMissions} />);

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("mission-1");
    });

    it("URLパラメータがある場合はそのクエストが選択される", () => {
      const originalURLSearchParams = global.URLSearchParams;
      global.URLSearchParams = jest.fn().mockImplementation(() => ({
        get: jest.fn().mockReturnValue("mission-2"),
      }));

      render(<MissionSelect missions={mockMissions} />);

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("mission-2");

      global.URLSearchParams = originalURLSearchParams;
    });
  });

  describe("クエスト変更時の動作", () => {
    it("クエストを変更するとrouterのpushが呼ばれる", () => {
      render(<MissionSelect missions={mockMissions} />);

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "mission-3" } });

      expect(mockPush).toHaveBeenCalledWith(
        "/ranking/ranking-mission?missionId=mission-3",
      );
    });

    it("選択値が更新される", () => {
      render(<MissionSelect missions={mockMissions} />);

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "mission-2" } });

      expect(select.value).toBe("mission-2");
    });
  });

  describe("エッジケース", () => {
    it("クエストが空の場合でもエラーにならない", () => {
      render(<MissionSelect missions={[]} />);

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });

    it("単一のクエストの場合", () => {
      const singleMission = [mockMissions[0]];
      render(<MissionSelect missions={singleMission} />);

      expect(screen.getByText("テストクエスト1")).toBeInTheDocument();
      expect(screen.queryByText("テストクエスト2")).not.toBeInTheDocument();
    });

    it("無効なmissionIdがURLにある場合は最初のクエストが選択される", () => {
      const originalURLSearchParams = global.URLSearchParams;
      global.URLSearchParams = jest.fn().mockImplementation(() => ({
        get: jest.fn().mockReturnValue("invalid-mission"),
      }));

      render(<MissionSelect missions={mockMissions} />);

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("mission-1");

      global.URLSearchParams = originalURLSearchParams;
    });
  });

  describe("カテゴリ別グループ化", () => {
    const make = (id: string, catId: string, title: string, sortNo: number) =>
      ({
        id,
        title: `${title}-クエスト`,
        mission_category_link: [
          {
            mission_category: {
              id: catId,
              category_title: title,
              sort_no: sortNo,
            },
          },
        ],
      }) as any;

    it("同一カテゴリに集約され、カテゴリはsort_no順", () => {
      const missions = [
        make("m1", "cat1", "カテゴリ1", 2),
        make("m2", "cat1", "カテゴリ1", 2),
        make("m0", "cat0", "カテゴリ0", 1),
      ];

      render(<MissionSelect missions={missions} />);

      const groups = screen.getAllByRole("group");
      expect(groups.map((g) => g.getAttribute("label"))).toEqual([
        "カテゴリ0",
        "カテゴリ1",
      ]);
      expect(groups[0].querySelectorAll("option").length).toBe(1);
      expect(groups[1].querySelectorAll("option").length).toBe(2);
    });
  });
});
