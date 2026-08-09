"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  copyMissionCategories,
  setMissionCategories,
} from "@/features/admin/services/admin-categories";
import { requireAdmin } from "@/features/admin/services/authorize-admin";
import { issueQrCode } from "@/features/qr-spot/services/qr-code";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";

export type AdminActionResult =
  | { success: true; missionId: string }
  | { success: false; error: string };

/** slug はURLに出るので、扱いやすい文字だけに限る */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const missionSchema = z.object({
  slug: z
    .string()
    .min(1, "slugは必須です")
    .max(80, "slugが長すぎます")
    .regex(
      SLUG_PATTERN,
      "slugは半角英小文字・数字・ハイフンで入力してください",
    ),
  title: z.string().min(1, "タイトルは必須です").max(200),
  content: z.string().max(20000).optional().nullable(),
  icon_url: z.string().max(500).optional().nullable(),
  required_artifact_type: z.enum(
    Object.keys(ARTIFACT_TYPES) as [string, ...string[]],
  ),
  difficulty: z.coerce.number().int().min(1).max(5),
  points: z.coerce.number().int().min(0).max(100000),
  max_achievement_count: z.coerce.number().int().min(1).nullable(),
  is_featured: z.boolean(),
  is_hidden: z.boolean(),
  event_date: z.string().optional().nullable(),
  artifact_label: z.string().max(200).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).nullable(),
  longitude: z.coerce.number().min(-180).max(180).nullable(),
});

export type MissionInput = z.input<typeof missionSchema>;

/** 空文字は「未入力」として null に寄せる。フォームからは "" で飛んでくる */
function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? null : text;
}

/**
 * チェックされたカテゴリを取り出す。
 *
 * 1つも選ばれていなければ空配列になり、紐付けは全解除される。
 * 「どのカテゴリにも入れない＝トップページに出さない」を意図した操作として扱う。
 */
function parseCategoryIds(formData: FormData): string[] {
  const ids = formData
    .getAll("category_ids")
    .filter(
      (value): value is string => typeof value === "string" && value !== "",
    );
  return Array.from(new Set(ids));
}

function parseMissionForm(formData: FormData) {
  return missionSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    content: emptyToNull(formData.get("content")),
    icon_url: emptyToNull(formData.get("icon_url")),
    required_artifact_type: String(
      formData.get("required_artifact_type") ?? "",
    ),
    difficulty: formData.get("difficulty"),
    points: formData.get("points"),
    max_achievement_count: emptyToNull(formData.get("max_achievement_count")),
    is_featured: formData.get("is_featured") === "on",
    is_hidden: formData.get("is_hidden") === "on",
    event_date: emptyToNull(formData.get("event_date")),
    artifact_label: emptyToNull(formData.get("artifact_label")),
    latitude: emptyToNull(formData.get("latitude")),
    longitude: emptyToNull(formData.get("longitude")),
  });
}

export async function createMission(
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = parseMissionForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createAdminClient();
  const id = crypto.randomUUID();

  const { error } = await supabase
    .from("missions")
    .insert({ id, ...parsed.data });

  if (error) {
    console.error("ミッションの作成に失敗:", error);
    // slug の一意制約が最も踏みやすいので個別に案内する
    if (error.code === "23505") {
      return { success: false, error: "そのslugは既に使われています" };
    }
    return { success: false, error: `作成に失敗しました: ${error.message}` };
  }

  const linked = await setMissionCategories(
    supabase,
    id,
    parseCategoryIds(formData),
  );

  if (linked.error) {
    // カテゴリが付かないミッションはトップページに出ない。中途半端な状態を
    // 残すと原因が分かりにくいので、作ったミッションごと取り消してやり直させる
    await supabase.from("missions").delete().eq("id", id);
    return { success: false, error: linked.error };
  }

  revalidatePath("/admin/missions");
  return { success: true, missionId: id };
}

export async function updateMission(
  missionId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = parseMissionForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("missions")
    .update(parsed.data)
    .eq("id", missionId);

  if (error) {
    console.error("ミッションの更新に失敗:", error);
    if (error.code === "23505") {
      return { success: false, error: "そのslugは既に使われています" };
    }
    return { success: false, error: `更新に失敗しました: ${error.message}` };
  }

  const linked = await setMissionCategories(
    supabase,
    missionId,
    parseCategoryIds(formData),
  );

  if (linked.error) {
    return { success: false, error: linked.error };
  }

  revalidatePath("/admin/missions");
  revalidatePath(`/admin/missions/${missionId}`);
  return { success: true, missionId };
}

/** 一覧から表示/非表示だけを切り替える */
export async function toggleMissionHidden(
  missionId: string,
  isHidden: boolean,
): Promise<AdminActionResult> {
  await requireAdmin();

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("missions")
    .update({ is_hidden: isHidden })
    .eq("id", missionId);

  if (error) {
    console.error("表示状態の変更に失敗:", error);
    return { success: false, error: `変更に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin/missions");
  return { success: true, missionId };
}

/**
 * QRコードを発行する。既にあれば作り直す。
 *
 * **作り直すと印刷済みのQRは読めなくなる。** 呼び出し側で確認を取ること。
 */
export async function issueMissionQrCode(
  missionId: string,
): Promise<AdminActionResult> {
  await requireAdmin();

  const supabase = await createAdminClient();
  const result = await issueQrCode(supabase, missionId);

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/missions");
  revalidatePath(`/admin/missions/${missionId}`);
  return { success: true, missionId };
}

/**
 * ミッションを複製する。
 *
 * イベントごとにQRチェックインを作るとき、毎回フォームを埋め直すのは手間。
 * 複製してタイトルと日付だけ書き換える運用を想定している。
 *
 * **QRコードは引き継がない。** 同じコードを2つのスポットに配ると、
 * どちらを読んでも同じミッションが達成されてしまう。
 * 複製先では改めて発行する。
 *
 * カテゴリの紐付けは引き継ぐ。同じカテゴリに並べるための複製だから。
 */
export async function duplicateMission(
  missionId: string,
): Promise<AdminActionResult> {
  await requireAdmin();

  const supabase = await createAdminClient();
  const { data: source, error: fetchError } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .single();

  if (fetchError || !source) {
    return { success: false, error: "複製元のミッションが見つかりません" };
  }

  const id = crypto.randomUUID();
  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...rest
  } = source;

  const { error } = await supabase.from("missions").insert({
    ...rest,
    id,
    // slug は一意なので必ず変える。作成時刻で衝突を避ける
    slug: `${source.slug}-copy-${Date.now()}`,
    title: `${source.title}（コピー）`,
    // 内容を確認してから公開させる
    is_hidden: true,
  });

  if (error) {
    console.error("ミッションの複製に失敗:", error);
    return { success: false, error: `複製に失敗しました: ${error.message}` };
  }

  const copied = await copyMissionCategories(supabase, missionId, id);
  if (copied.error) {
    // ミッション自体は作れている。カテゴリだけ画面で選び直せば済むので消さない
    console.error("複製先へのカテゴリのコピーに失敗:", copied.error);
  }

  revalidatePath("/admin/missions");
  return { success: true, missionId: id };
}
