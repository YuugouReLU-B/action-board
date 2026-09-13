import "server-only";

import { createAdminClient } from "@/lib/supabase/adminClient";
import type { Tables } from "@/lib/types/supabase";

export type LotterySettings = Tables<"lottery_settings">;

const SETTINGS_ID = "default";

/**
 * 抽選応募パネル（マイページ表示）の設定を取得する。
 *
 * 固定ID `'default'` の1行だけを持つシングルトンテーブルから読む。
 * マイグレーションで初期行を必ず挿入しているため、通常は null にならない。
 */
export async function getLotterySettings(): Promise<LotterySettings | null> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("lottery_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .single();

  if (error) {
    console.error("抽選応募設定の取得に失敗:", error);
    return null;
  }

  return data;
}
