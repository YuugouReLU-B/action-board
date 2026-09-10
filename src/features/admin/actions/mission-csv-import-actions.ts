"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/services/authorize-admin";
import {
  importMissionCsvRows,
  type MissionCsvImportResult,
  parseMissionCsv,
} from "@/features/admin/services/mission-csv-import";
import { createAdminClient } from "@/lib/supabase/adminClient";

export type ImportMissionCsvResult =
  | { success: true; result: MissionCsvImportResult }
  | { success: false; error: string };

/**
 * イベント登録CSVをアップロードし、有効な行だけを一括登録する。
 * 行単位でエラーを返すので、失敗した行だけ直して再アップロードすればよい
 * （成功済みの行はslugの一意制約により再登録されない）。
 */
export async function importMissionCsv(
  formData: FormData,
): Promise<ImportMissionCsvResult> {
  await requireAdmin();

  const file = formData.get("csv_file");
  if (!(file instanceof File)) {
    return { success: false, error: "CSVファイルを選択してください" };
  }

  const csvText = await file.text();
  const rows = parseMissionCsv(csvText);
  if (rows.length === 0) {
    return { success: false, error: "CSVにデータ行がありません" };
  }

  const supabase = await createAdminClient();
  const result = await importMissionCsvRows(supabase, rows);

  if (result.succeeded.length > 0) {
    revalidatePath("/admin/missions");
  }

  return { success: true, result };
}
