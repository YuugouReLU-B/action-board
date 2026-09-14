import { render, screen } from "@testing-library/react";
import type React from "react";
import type { Tables } from "@/lib/types/supabase";
import Mission from "./mission-card";

jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar">{children}</div>
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: テスト用モックのため<img>を使用
    <img src={src} alt={alt} data-testid="avatar-image" />
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardFooter: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card-footer">
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  ),
}));

jest.mock("@/features/missions/components/difficulty-badge", () => ({
  DifficultyBadge: ({
    difficulty,
    className,
  }: {
    difficulty: number;
    points: number;
    className?: string;
  }) => (
    <span className={className} data-testid="difficulty-badge">
      難易度{difficulty}
    </span>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <button type="button" className={className} data-testid="button">
      {children}
    </button>
  ),
}));

jest.mock("@/features/missions/components/mission-icon", () => ({
  MissionIcon: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: テスト用モックのため<img>を使用
    <img src={src} alt={alt} data-testid="mission-icon" />
  ),
}));

jest.mock("@/features/missions/components/mission-achievement-status", () => {
  return function MockMissionAchievementStatus({
    hasReachedMaxAchievements,
  }: {
    hasReachedMaxAchievements: boolean;
  }) {
    if (hasReachedMaxAchievements) {
      return <div data-testid="achievement-status">達成済み</div>;
    }
    return null;
  };
});

jest.mock("lucide-react", () => ({
  MapPin: ({ className }: { className?: string }) => (
    <div className={className} data-testid="map-pin-icon" />
  ),
}));

const mockMission: Tables<"missions"> = {
  id: "test-mission-1",
  slug: "test-mission-1",
  title: "テストミッション",
  content: "テストミッションの内容",
  difficulty: 1,
  points: 50,
  latitude: null,
  longitude: null,
  radius_meters: null,
  icon_url: "/test-icon.svg",
  quest_category: "PERMANENT",
  event_category: null,
  event_date: "2025-06-22",
  max_achievement_count: 3,
  is_featured: false,
  is_hidden: false,
  featured_importance: null,
  required_artifact_type: "NONE",
  artifact_label: null,
  supplement: null,
  tag1: null,
  tag2: null,
  tag3: null,
  event_end_date: null,
  event_type: null,
  ogp_image_url: null,
  created_at: "2025-06-22T00:00:00Z",
  updated_at: "2025-06-22T00:00:00Z",
};

describe("Mission", () => {
  it.each([
    ["SPOT", "spot.png"],
    ["SPORTS", "sports.png"],
    ["ART", "art.png"],
    ["FOOD", "food.png"],
    ["MIXED", "mixed-event.png"],
  ] as const)("%sの固定アイコンを表示する", (event_category, filename) => {
    render(
      <Mission
        mission={{ ...mockMission, event_category }}
        userAchievementCount={0}
      />,
    );
    expect(screen.getByTestId("mission-icon")).toHaveAttribute(
      "src",
      `/img/quest-icons/${filename}`,
    );
  });
  it("ミッション情報が正しく表示される", () => {
    render(<Mission mission={mockMission} userAchievementCount={0} />);

    expect(screen.getByText("テストミッション")).toBeInTheDocument();
    expect(screen.getByText("50P獲得")).toBeInTheDocument();
  });

  it("イベント日付が正しく表示される", () => {
    render(<Mission mission={mockMission} userAchievementCount={0} />);

    expect(screen.getByText("6月22日（日）開催")).toBeInTheDocument();
  });

  it("最大達成回数に達した場合の表示が正しい", () => {
    render(<Mission mission={mockMission} userAchievementCount={3} />);

    expect(screen.getByText("クリア済み")).toBeInTheDocument();
  });

  it("最大達成回数が設定されていない場合は制限なし", () => {
    const missionWithoutLimit = { ...mockMission, max_achievement_count: null };

    render(<Mission mission={missionWithoutLimit} userAchievementCount={5} />);

    expect(screen.getByText("もう一回50P獲得")).toBeInTheDocument();
  });

  it("イベントカテゴリ未設定なら既存icon_urlを無視してフォールバック画像を使用", () => {
    const missionWithoutIcon = { ...mockMission, event_category: null };

    render(<Mission mission={missionWithoutIcon} userAchievementCount={0} />);

    const missionIcon = document.querySelector("img");
    expect(missionIcon?.getAttribute("src")).toContain("mission_fallback.svg");
  });

  it("tag1が設定されている場合は地域チップが表示される", () => {
    const missionWithTag = { ...mockMission, tag1: "いわき市" };

    render(<Mission mission={missionWithTag} userAchievementCount={0} />);

    expect(screen.getByText("いわき市")).toBeInTheDocument();
    expect(screen.getByTestId("map-pin-icon")).toBeInTheDocument();
    expect(
      screen
        .getByTestId("card-footer")
        .querySelectorAll(".rounded-full.border"),
    ).toHaveLength(1);
  });

  it("tag1とtag2が設定されている場合は両方のチップが表示される", () => {
    const missionWithTags = {
      ...mockMission,
      tag1: "いわき市",
      tag2: "地域交流",
    };

    render(<Mission mission={missionWithTags} userAchievementCount={0} />);

    const tag1Badge = screen.getByText("いわき市").parentElement;
    const tag2Badge = screen.getByText("地域交流").parentElement;
    expect(tag1Badge).toHaveClass("rounded-full", "border");
    expect(tag2Badge).toHaveClass("rounded-full", "border");
    expect(tag1Badge?.parentElement).toBe(tag2Badge?.parentElement);
    expect(screen.getByTestId("map-pin-icon").parentElement).toBe(tag1Badge);
  });

  it("tag1がnullでもtag2のチップは表示される", () => {
    const missionWithTag2 = { ...mockMission, tag2: "地域交流" };

    render(<Mission mission={missionWithTag2} userAchievementCount={0} />);

    expect(screen.getByText("地域交流")).toBeInTheDocument();
    expect(screen.queryByTestId("map-pin-icon")).not.toBeInTheDocument();
    expect(
      screen
        .getByTestId("card-footer")
        .querySelectorAll(".rounded-full.border"),
    ).toHaveLength(1);
  });

  it("tag1とtag2が両方nullの場合はチップ群が表示されない", () => {
    render(<Mission mission={mockMission} userAchievementCount={0} />);

    expect(screen.queryByTestId("map-pin-icon")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-footer").children).toHaveLength(1);
    expect(screen.getByTestId("card-footer").firstElementChild).toBe(
      screen.getByRole("link"),
    );
  });

  it("イベント日付がnullの場合は日付表示なし", () => {
    const missionWithoutDate = { ...mockMission, event_date: null };

    render(<Mission mission={missionWithoutDate} userAchievementCount={0} />);

    expect(screen.queryByText(/開催/)).not.toBeInTheDocument();
  });
});
