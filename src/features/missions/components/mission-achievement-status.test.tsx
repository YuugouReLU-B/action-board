import { render, screen } from "@testing-library/react";
import MissionAchievementStatus from "./mission-achievement-status";

describe("MissionAchievementStatus", () => {
  it("最大達成回数に達した場合は完了メッセージが表示される", () => {
    render(<MissionAchievementStatus hasReachedMaxAchievements={true} />);

    expect(screen.getByText("達成済み")).toBeInTheDocument();
  });

  it("最大達成回数に達していない場合は何も表示されない", () => {
    const { container } = render(
      <MissionAchievementStatus hasReachedMaxAchievements={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
