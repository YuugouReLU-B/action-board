import "server-only";

import { getCurrentSeasonId } from "@/lib/services/seasons";
import { createAdminClient } from "@/lib/supabase/adminClient";

/**
 * レベルアップ通知を確認済みとしてマークする
 */
export async function markLevelUpNotificationAsSeen(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();
  const currentSeasonId = await getCurrentSeasonId();

  if (!currentSeasonId) {
    console.error("Current season not found");
    return { success: false, error: "現在のシーズンが見つかりません" };
  }

  try {
    // 現在のレベルを取得（シーズン対応）
    const { data: userLevel, error: fetchError } = await supabase
      .from("user_levels")
      .select("level")
      .eq("user_id", userId)
      .eq("season_id", currentSeasonId)
      .single();

    if (fetchError || !userLevel) {
      console.error("Failed to fetch user level:", fetchError);
      return { success: false, error: "ユーザーレベルの取得に失敗しました" };
    }

    // last_notified_levelを現在のレベルに更新（シーズン対応）
    const { error: updateError } = await supabase
      .from("user_levels")
      .update({
        last_notified_level: userLevel.level,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("season_id", currentSeasonId);

    if (updateError) {
      console.error("Failed to update last_notified_level:", updateError);
      return { success: false, error: "通知状態の更新に失敗しました" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markLevelUpNotificationAsSeen:", error);
    return { success: false, error: "予期しないエラーが発生しました" };
  }
}
