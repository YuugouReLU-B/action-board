import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/services/authorize-admin";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { updateLotterySettings } from "./lottery-settings-actions";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/features/admin/services/authorize-admin");
jest.mock("@/lib/supabase/adminClient", () => ({
  createAdminClient: jest.fn(),
}));

const mockEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ update: mockUpdate }));

function formData(date: string) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    threshold_points: "1000",
    title: "抽選応募",
    description: "抽選のご案内",
    button_label: "応募する",
    form_url: "",
    eligible_display_from: date,
  })) {
    form.set(key, value);
  }
  return form;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(createAdminClient).mockResolvedValue({
    from: mockFrom,
  } as unknown as Awaited<ReturnType<typeof createAdminClient>>);
  mockEq.mockResolvedValue({ error: null });
});

it.each([
  ["2026-09-14", "2026-09-14"],
  ["", null],
])("開始日の設定・解除を固定IDに保存する: %s", async (input, saved) => {
  expect(await updateLotterySettings(formData(input as string))).toEqual({
    success: true,
  });
  expect(requireAdmin).toHaveBeenCalledTimes(1);
  expect(mockFrom).toHaveBeenCalledWith("lottery_settings");
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({ eligible_display_from: saved }),
  );
  expect(mockEq).toHaveBeenCalledWith("id", "default");
  expect(revalidatePath).toHaveBeenCalledWith("/admin/lottery");
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
});

it("不正な日付はDBへ送らない", async () => {
  expect(await updateLotterySettings(formData("2026-02-30"))).toEqual({
    success: false,
    error: expect.any(String),
  });
  expect(createAdminClient).not.toHaveBeenCalled();
});

it("管理者認可に失敗したら更新しない", async () => {
  jest.mocked(requireAdmin).mockRejectedValueOnce(new Error("Unauthorized"));
  await expect(updateLotterySettings(formData("2026-09-14"))).rejects.toThrow(
    "Unauthorized",
  );
  expect(createAdminClient).not.toHaveBeenCalled();
});
