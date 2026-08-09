import "server-only";

import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { APP_ORIGIN } from "@/lib/constants/app-origin";
import type { Database } from "@/lib/types/supabase";

/** QRが指すパス。`/q/<code>` */
export const QR_SCAN_PATH = "/q";

/**
 * QRコードの文字列長（base64url 換算）。
 *
 * 16バイト＝128ビットあれば総当たりは現実的でない。
 * 印刷したQRの情報量にも影響するので無闇に長くしない。
 */
const CODE_BYTES = 16;

export function generateQrCode(): string {
  return randomBytes(CODE_BYTES).toString("base64url");
}

export function buildQrUrl(code: string): string {
  return `${APP_ORIGIN}${QR_SCAN_PATH}/${code}`;
}

/**
 * ミッションのQRコードを発行する。既にあれば作り直す。
 *
 * **作り直すと印刷済みのQRは無効になる。** 呼び出し側で警告すること。
 */
export async function issueQrCode(
  adminSupabase: SupabaseClient<Database>,
  missionId: string,
): Promise<{ code: string } | { error: string }> {
  const code = generateQrCode();

  const { error } = await adminSupabase
    .from("mission_qr_codes")
    .upsert(
      { mission_id: missionId, code, updated_at: new Date().toISOString() },
      { onConflict: "mission_id" },
    );

  if (error) {
    console.error("QRコードの発行に失敗:", error);
    return { error: "QRコードの発行に失敗しました" };
  }

  return { code };
}

/** ミッションに紐づくQRコードを取得する。未発行なら null */
export async function getQrCodeForMission(
  adminSupabase: SupabaseClient<Database>,
  missionId: string,
): Promise<string | null> {
  const { data, error } = await adminSupabase
    .from("mission_qr_codes")
    .select("code")
    .eq("mission_id", missionId)
    .maybeSingle();

  if (error) {
    console.error("QRコードの取得に失敗:", error);
    return null;
  }
  return data?.code ?? null;
}

/** 発行済みのQRコードをミッションIDごとに引けるMapで返す（一覧表示用） */
export async function getQrCodeMap(
  adminSupabase: SupabaseClient<Database>,
): Promise<Map<string, string>> {
  const { data, error } = await adminSupabase
    .from("mission_qr_codes")
    .select("mission_id, code");

  if (error) {
    console.error("QRコード一覧の取得に失敗:", error);
    return new Map();
  }
  return new Map((data ?? []).map((row) => [row.mission_id, row.code]));
}

export type QrSpotMission = {
  id: string;
  slug: string;
  title: string;
  points: number;
  isHidden: boolean;
  maxAchievementCount: number | null;
};

/**
 * QRコードからミッションを引く。
 *
 * コードは推測不能な文字列そのものが認証材料なので、
 * **service_role でしか引けないテーブルを使う**（RLSポリシーを作っていない）。
 */
export async function findMissionByQrCode(
  adminSupabase: SupabaseClient<Database>,
  code: string,
): Promise<QrSpotMission | null> {
  const { data, error } = await adminSupabase
    .from("mission_qr_codes")
    .select(
      "missions!inner(id, slug, title, points, is_hidden, max_achievement_count)",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("QRコードからのミッション取得に失敗:", error);
    return null;
  }
  if (!data?.missions) return null;

  const mission = data.missions;
  return {
    id: mission.id,
    slug: mission.slug,
    title: mission.title,
    points: mission.points,
    isHidden: mission.is_hidden,
    maxAchievementCount: mission.max_achievement_count,
  };
}
