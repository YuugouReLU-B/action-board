import "server-only";

import { getQrCodeMap } from "@/features/qr-spot/services/qr-code";
import { createAdminClient } from "@/lib/supabase/adminClient";
import type { Tables } from "@/lib/types/supabase";

export type AdminMission = Tables<"missions"> & {
  /** 発行済みのQRコード。QRタイプでも未発行なら null */
  qrCode: string | null;
  achievementCount: number;
};

/**
 * 管理画面用のミッション一覧。
 *
 * 非表示のものも含めて全件返す。達成数は運用判断（このスポットは
 * 回られているか）に要るので一緒に引く。
 */
export async function listMissionsForAdmin(): Promise<AdminMission[]> {
  const supabase = await createAdminClient();

  const [{ data: missions, error }, qrCodes] = await Promise.all([
    supabase.from("missions").select("*").order("title"),
    getQrCodeMap(supabase),
  ]);

  if (error) {
    console.error("管理用ミッション一覧の取得に失敗:", error);
    return [];
  }

  const { data: achievements } = await supabase
    .from("achievements")
    .select("mission_id");

  const counts = new Map<string, number>();
  for (const a of achievements ?? []) {
    if (!a.mission_id) continue;
    counts.set(a.mission_id, (counts.get(a.mission_id) ?? 0) + 1);
  }

  return (missions ?? []).map((mission) => ({
    ...mission,
    qrCode: qrCodes.get(mission.id) ?? null,
    achievementCount: counts.get(mission.id) ?? 0,
  }));
}

export async function getMissionForAdmin(
  missionId: string,
): Promise<AdminMission | null> {
  const supabase = await createAdminClient();

  const { data: mission, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();

  if (error || !mission) {
    if (error) console.error("管理用ミッションの取得に失敗:", error);
    return null;
  }

  const qrCodes = await getQrCodeMap(supabase);
  const { count } = await supabase
    .from("achievements")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", missionId);

  return {
    ...mission,
    qrCode: qrCodes.get(mission.id) ?? null,
    achievementCount: count ?? 0,
  };
}
