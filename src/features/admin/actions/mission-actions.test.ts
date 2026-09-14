import { requireAdmin } from "@/features/admin/services/authorize-admin";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createMission, updateMission } from "./mission-actions";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/features/admin/services/authorize-admin", () => ({
  requireAdmin: jest.fn(),
}));
jest.mock("@/features/admin/services/admin-categories", () => ({
  setMissionCategories: jest.fn().mockResolvedValue({ error: null }),
  copyMissionCategories: jest.fn(),
}));
jest.mock("@/features/qr-spot/services/qr-code", () => ({
  issueQrCode: jest.fn(),
}));

const insert = jest.fn().mockResolvedValue({ error: null });
const eq = jest.fn().mockResolvedValue({ error: null });
const update = jest.fn((_data: Record<string, unknown>) => ({ eq }));
const from = jest.fn(() => ({ insert, update }));

function form(quest = "SPECIAL_TOKYO", event = "FOOD") {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    slug: "test-quest",
    title: "テスト",
    required_artifact_type: "QR",
    difficulty: "1",
    points: "50",
    quest_category: quest,
    event_category: event,
    icon_url: "https://old.example/icon.png",
  }))
    data.set(key, value);
  return data;
}

describe("mission category actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(requireAdmin)
      .mockResolvedValue({ id: "admin" } as Awaited<
        ReturnType<typeof requireAdmin>
      >);
    jest
      .mocked(createAdminClient)
      .mockReturnValue({ from } as unknown as ReturnType<
        typeof createAdminClient
      >);
  });
  it("新規作成時に分類を保存し、旧画像入力を無視する", async () => {
    expect(await createMission(form())).toMatchObject({ success: true });
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        quest_category: "SPECIAL_TOKYO",
        event_category: "FOOD",
      }),
    );
    expect(insert.mock.calls[0][0]).not.toHaveProperty("icon_url");
  });
  it("更新時にイベントカテゴリを未設定に戻せる", async () => {
    expect(await updateMission("m1", form("SNS", ""))).toMatchObject({
      success: true,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ quest_category: "SNS", event_category: null }),
    );
    expect(update.mock.calls[0][0]).not.toHaveProperty("icon_url");
    expect(eq).toHaveBeenCalledWith("id", "m1");
  });
  it.each([
    ["", ""],
    ["INVALID", ""],
    ["PERMANENT", "INVALID"],
  ])("不正な分類(%s, %s)はDBに書き込まない", async (quest, event) => {
    expect(await createMission(form(quest, event))).toMatchObject({
      success: false,
    });
    expect(from).not.toHaveBeenCalled();
  });
  it("管理者認可に失敗するとDBに書き込まない", async () => {
    jest.mocked(requireAdmin).mockRejectedValueOnce(new Error("権限なし"));
    await expect(updateMission("m1", form())).rejects.toThrow("権限なし");
    expect(from).not.toHaveBeenCalled();
  });
});
