import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Tables } from "@/lib/types/supabase";
import { MissionForm } from "./mission-form";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
const action = jest.fn();

describe("MissionForm categories", () => {
  it("必須分類の初期値と任意分類の未設定を持ち、画像入力を表示しない", () => {
    const { container } = render(
      <MissionForm categories={[]} action={action} submitLabel="保存" />,
    );
    const quest = screen.getByLabelText("クエストカテゴリ");
    expect(quest).toBeRequired();
    expect(quest).toHaveValue("PERMANENT");
    expect(within(quest).getAllByRole("option")).toHaveLength(4);
    expect(screen.getByLabelText("イベントカテゴリ")).toHaveValue("");
    expect(
      within(screen.getByLabelText("イベントカテゴリ")).getAllByRole("option"),
    ).toHaveLength(6);
    expect(
      container.querySelector(
        '[name="icon_url"], [name="icon_file"], input[type="file"]',
      ),
    ).toBeNull();
    fireEvent.change(quest, { target: { value: "SPECIAL_TOKYO" } });
    fireEvent.change(screen.getByLabelText("イベントカテゴリ"), {
      target: { value: "FOOD" },
    });
    const form = container.querySelector("form");
    if (!form) throw new Error("フォームがありません");
    const data = new FormData(form);
    expect(data.get("quest_category")).toBe("SPECIAL_TOKYO");
    expect(data.get("event_category")).toBe("FOOD");
  });
  it("編集時は保存済みの分類を選択する", () => {
    const mission = {
      quest_category: "SPECIAL_HAMADORI",
      event_category: "ART",
    } as Tables<"missions">;
    render(
      <MissionForm
        mission={mission}
        categories={[]}
        action={action}
        submitLabel="保存"
      />,
    );
    expect(screen.getByLabelText("クエストカテゴリ")).toHaveValue(
      "SPECIAL_HAMADORI",
    );
    expect(screen.getByLabelText("イベントカテゴリ")).toHaveValue("ART");
  });
});
