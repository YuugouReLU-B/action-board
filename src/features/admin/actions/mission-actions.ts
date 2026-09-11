"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { missionSchema } from "@/features/admin/schemas/mission-schema";
import {
  copyMissionCategories,
  setMissionCategories,
} from "@/features/admin/services/admin-categories";
import { requireAdmin } from "@/features/admin/services/authorize-admin";
import { issueQrCode } from "@/features/qr-spot/services/qr-code";
import {
  MISSION_ASSET_ALLOWED_MIME_TYPES,
  MISSION_ASSET_BUCKET,
  MISSION_ASSET_MAX_FILE_SIZE,
} from "@/lib/services/mission-assets";
import { createAdminClient } from "@/lib/supabase/adminClient";
import type { Database } from "@/lib/types/supabase";

export type AdminActionResult =
  | { success: true; missionId: string }
  | { success: false; error: string };

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
    ogp_image_url: emptyToNull(formData.get("ogp_image_url")),
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
    radius_meters: emptyToNull(formData.get("radius_meters")),
  });
}

/**
 * フォームで選択されたファイルを mission-assets バケットにアップロードし、公開URLを返す。
 * ファイルが選択されていなければ null を返す（＝既存の値を変えない）。
 */
async function uploadMissionAssetIfProvided(
  supabase: SupabaseClient<Database>,
  formData: FormData,
  fieldName: string,
  missionId: string,
  folder: "icons" | "photos",
): Promise<{ url: string | null; error?: string }> {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) {
    return { url: null };
  }

  if (file.size > MISSION_ASSET_MAX_FILE_SIZE) {
    return { url: null, error: "画像ファイルのサイズは5MB以下にしてください" };
  }
  if (!MISSION_ASSET_ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      url: null,
      error: "対応している画像形式はJPEG、PNG、WebP、SVGです",
    };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${folder}/${missionId}-${Date.now()}.${fileExt}`;
  const fileBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(MISSION_ASSET_BUCKET)
    .upload(fileName, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error(`ミッション画像（${folder}）のアップロードに失敗:`, error);
    return { url: null, error: "画像のアップロードに失敗しました" };
  }

  const { data } = supabase.storage
    .from(MISSION_ASSET_BUCKET)
    .getPublicUrl(fileName);

  return { url: data.publicUrl };
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

  const icon = await uploadMissionAssetIfProvided(
    supabase,
    formData,
    "icon_file",
    id,
    "icons",
  );
  if (icon.error) {
    return { success: false, error: icon.error };
  }
  const photo = await uploadMissionAssetIfProvided(
    supabase,
    formData,
    "photo_file",
    id,
    "photos",
  );
  if (photo.error) {
    return { success: false, error: photo.error };
  }

  const { error } = await supabase.from("missions").insert({
    id,
    ...parsed.data,
    icon_url: icon.url ?? parsed.data.icon_url,
    ogp_image_url: photo.url ?? parsed.data.ogp_image_url,
  });

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

  const icon = await uploadMissionAssetIfProvided(
    supabase,
    formData,
    "icon_file",
    missionId,
    "icons",
  );
  if (icon.error) {
    return { success: false, error: icon.error };
  }
  const photo = await uploadMissionAssetIfProvided(
    supabase,
    formData,
    "photo_file",
    missionId,
    "photos",
  );
  if (photo.error) {
    return { success: false, error: photo.error };
  }

  const { error } = await supabase
    .from("missions")
    .update({
      ...parsed.data,
      icon_url: icon.url ?? parsed.data.icon_url,
      ogp_image_url: photo.url ?? parsed.data.ogp_image_url,
    })
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
