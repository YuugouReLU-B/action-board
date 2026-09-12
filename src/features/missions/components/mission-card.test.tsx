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
    userAchievementCount,
    maxAchievementCount,
  }: {
    hasReachedMaxAchievements: boolean;
    userAchievementCount: number;
    maxAchievementCount: number | null;
  }) {
    if (hasReachedMaxAchievements) {
      return <div data-testid="achievement-status">達成済み</div>;
    }
    if (maxAchievementCount !== null) {
      return (
        <div data-testid="achievement-status">
          {userAchievementCount}/{maxAchievementCount}回達成
        </div>
      );
    }
    return (
      <div data-testid="achievement-status">{userAchievementCount}回達成</div>
    );
  };
});

jest.mock("lucide-react", () => ({
  UsersRound: ({ className }: { className?: string }) => (
    <div className={className} data-testid="users-round-icon" />
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
  event_date: "2025-06-22",
  max_achievement_count: 3,
  is_featured: false,
  is_hidden: false,
  featured_importance: null,
  required_artifact_type: "NONE",
  artifact_label: null,
  ogp_image_url: null,
  created_at: "2025-06-22T00:00:00Z",
  updated_at: "2025-06-22T00:00:00Z",
};

describe("Mission", () => {
  it("ミッション情報が正しく表示される", () => {
    render(
      <Mission
        mission={mockMission}
        achievementsCount={10}
        userAchievementCount={0}
      />,
    );

    expect(screen.getByText("テストミッション")).toBeInTheDocument();
    expect(screen.getByText("みんなで10回達成")).toBeInTheDocument();
    expect(screen.getByText("ポイントを獲得🔥")).toBeInTheDocument();
  });

  it("イベント日付が正しく表示される", () => {
    render(
      <Mission
        mission={mockMission}
        achievementsCount={5}
        userAchievementCount={0}
      />,
    );

    expect(screen.getByText("6月22日（日）開催")).toBeInTheDocument();
  });

  it("最大達成回数に達した場合の表示が正しい", () => {
    render(
      <Mission
        mission={mockMission}
        achievementsCount={15}
        userAchievementCount={3}
      />,
    );

    expect(screen.getByText("ミッションクリア🎉")).toBeInTheDocument();
  });

  it("最大達成回数が設定されていない場合は制限なし", () => {
    const missionWithoutLimit = { ...mockMission, max_achievement_count: null };

    render(
      <Mission
        mission={missionWithoutLimit}
        achievementsCount={20}
        userAchievementCount={5}
      />,
    );

    expect(screen.getByText("もう一回チャレンジ🔥")).toBeInTheDocument();
  });

  it("アイコンURLがnullの場合はフォールバック画像を使用", () => {
    const missionWithoutIcon = { ...mockMission, icon_url: null };

    render(
      <Mission
        mission={missionWithoutIcon}
        achievementsCount={0}
        userAchievementCount={0}
      />,
    );

    const missionIcon = document.querySelector("img");
    expect(missionIcon?.getAttribute("src")).toContain("mission_fallback.svg");
  });

  it("達成回数が0の場合の表示", () => {
    render(
      <Mission
        mission={mockMission}
        achievementsCount={0}
        userAchievementCount={0}
      />,
    );

    expect(screen.getByText("みんなで0回達成")).toBeInTheDocument();
  });

  it("ポスティングミッションでは枚数表示になる", () => {
    const postingMission = {
      ...mockMission,
      required_artifact_type: "POSTING",
    };

    render(
      <Mission
        mission={postingMission}
        achievementsCount={30000}
        userAchievementCount={0}
      />,
    );

    const formattedCount = (30000).toLocaleString();
    expect(
      screen.getByText(`みんなで${formattedCount}枚達成`),
    ).toBeInTheDocument();
  });

  it("イベント日付がnullの場合は日付表示なし", () => {
    const missionWithoutDate = { ...mockMission, event_date: null };

    render(
      <Mission
        mission={missionWithoutDate}
        achievementsCount={5}
        userAchievementCount={0}
      />,
    );

    expect(screen.queryByText(/開催/)).not.toBeInTheDocument();
  });
});
