import "server-only";

import type {
  AchievementData,
  RegistrationData,
} from "@/features/metrics/types/metrics-types";
import { createClient } from "@/lib/supabase/client";

/**
 * アクション達成数データをSupabaseから取得
 *
 * @param startDate - 開始日（オプション）指定した場合はその日以降のデータのみ取得
 * @returns Promise<AchievementData> - アクション達成数データ
 */
export async function fetchAchievementData(
  startDate?: Date,
): Promise<AchievementData> {
  const supabase = createClient();

  let totalQuery = supabase
    .from("achievements")
    .select("*", { count: "exact", head: true });

  if (startDate) {
    totalQuery = totalQuery.gte("created_at", startDate.toISOString());
  }

  const { count: totalCount } = await totalQuery;

  const date = new Date();
  date.setHours(date.getHours() - 24);

  const { count: todayCount } = await supabase
    .from("achievements")
    .select("*", { count: "exact", head: true })
    .gte("created_at", date.toISOString());

  return {
    totalCount: totalCount || 0,
    todayCount: todayCount || 0,
  };
}

/**
 * ユーザー登録数データをSupabaseから取得
 *
 * @returns Promise<RegistrationData> - ユーザー登録数データ
 */
export async function fetchRegistrationData(): Promise<RegistrationData> {
  const supabase = createClient();

  const { count: totalCount } = await supabase
    .from("public_user_profiles")
    .select("*", { count: "exact", head: true });

  const date = new Date();
  date.setHours(date.getHours() - 24);

  const { count: todayCount } = await supabase
    .from("public_user_profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", date.toISOString());

  return {
    totalCount: totalCount || 0,
    todayCount: todayCount || 0,
  };
}
