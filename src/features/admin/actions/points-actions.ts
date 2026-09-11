"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/services/authorize-admin";
import { grantXp } from "@/features/user-level/services/level";

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * デバッグ用：任意のユーザーのポイントを増減する。
 *
 * 本番運用の付与経路（ミッション達成）とは別に、動作確認のために
 * 管理画面から直接XPを足し引きできるようにする。
 */
export async function adjustUserPoints(
  userId: string,
  amount: number,
  reason: string,
): Promise<AdminActionResult> {
  await requireAdmin();

  if (!Number.isInteger(amount) || amount === 0) {
    return { success: false, error: "0以外の整数を入力してください" };
  }

  const trimmedReason = reason.trim();
  const description = trimmedReason
    ? `管理画面調整: ${trimmedReason}`
    : `管理画面によるポイント調整（${amount > 0 ? "+" : ""}${amount}）`;

  const result = await grantXp(
    userId,
    amount,
    amount > 0 ? "BONUS" : "PENALTY",
    undefined,
    description,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? "ポイントの調整に失敗しました",
    };
  }

  revalidatePath("/admin/points");
  return { success: true };
}
