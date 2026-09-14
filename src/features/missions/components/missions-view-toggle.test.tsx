import { fireEvent, render, screen } from "@testing-library/react";
import type { TaggedMission } from "./missions-tags";
import { MissionsViewToggle } from "./missions-view-toggle";

jest.unmock("lucide-react");

jest.mock("./missions-map-view", () => ({
  MissionsMapView: () => <div>地図の内容</div>,
}));
jest.mock("./missions-calendar-view", () => ({
  MissionsCalendarView: () => <div>カレンダーの内容</div>,
}));

it("タグフィルターを表示せず、一覧・地図・カレンダーを切り替えられる", () => {
  const missions = [{} as TaggedMission];
  render(
    <MissionsViewToggle mapMissions={missions} calendarMissions={missions}>
      <h3>常設クエスト</h3>
    </MissionsViewToggle>,
  );
  expect(
    screen.getByRole("heading", { name: "常設クエスト" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "常設クエスト" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "地図" }));
  expect(screen.getByText("地図の内容")).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "常設クエスト" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "カレンダー" }));
  expect(screen.getByText("カレンダーの内容")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "一覧" }));
  expect(
    screen.getByRole("heading", { name: "常設クエスト" }),
  ).toBeInTheDocument();
});
