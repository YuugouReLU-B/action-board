import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  diffCategoryIds,
  nextSortNo,
} from "@/features/admin/utils/category-links";
import { createAdminClient } from "@/lib/supabase/adminClient";
import type { Database } from "@/lib/types/supabase";

export type AdminCategory = {
  id: string;
  title: string;
  sortNo: number;
  /**
   * いまトップページに出ているミッションの数。
   *
   * 移植元から引き継いだ使っていないカテゴリが多く残っているので、
   * 生きているカテゴリを見分けるために添える。
   */
  visibleMissionCount: number;
};

/** 管理画面のカテゴリ選択に出す一覧。トップページと同じ表示順に並べる */
export async function listCategoriesForAdmin(): Promise<AdminCategory[]> {
  const supabase = await createAdminClient();

  const [{ data, error }, { data: visibleRows }] = await Promise.all([
    supabase
      .from("mission_category")
      .select("id, category_title, sort_no")
      .eq("del_flg", false)
      .order("sort_no", { ascending: true }),
    // ビューは非表示ミッションと削除済みカテゴリを既に除いている
    supabase
      .from("mission_category_view")
      .select("category_id"),
  ]);

  if (error) {
    console.error("カテゴリ一覧の取得に失敗:", error);
    return [];
  }

  const visibleCounts = new Map<string, number>();
  for (const row of visibleRows ?? []) {
    if (!row.category_id) continue;
    visibleCounts.set(
      row.category_id,
      (visibleCounts.get(row.category_id) ?? 0) + 1,
    );
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.category_title ?? "(名称未設定)",
    sortNo: row.sort_no,
    visibleMissionCount: visibleCounts.get(row.id) ?? 0,
  }));
}

/** 1ミッションが属するカテゴリID。編集フォームの初期値に使う */
export async function getCategoryIdsForMission(
  adminSupabase: SupabaseClient<Database>,
  missionId: string,
): Promise<string[]> {
  const { data, error } = await adminSupabase
    .from("mission_category_link")
    .select("category_id")
    .eq("mission_id", missionId)
    .eq("del_flg", false);

  if (error) {
    console.error("ミッションのカテゴリ取得に失敗:", error);
    return [];
  }
  return (data ?? []).map((row) => row.category_id);
}

/**
 * ミッションIDごとのカテゴリ名。一覧画面で
 * 「どのカテゴリにも入っていない＝トップに出ない」を見せるために使う。
 */
export async function getCategoryTitleMap(
  adminSupabase: SupabaseClient<Database>,
): Promise<Map<string, string[]>> {
  const { data, error } = await adminSupabase
    .from("mission_category_link")
    .select("mission_id, mission_category(category_title, sort_no)")
    .eq("del_flg", false);

  if (error) {
    console.error("カテゴリ紐付けの取得に失敗:", error);
    return new Map();
  }

  const rows = [...(data ?? [])].sort(
    (a, b) =>
      (a.mission_category?.sort_no ?? 0) - (b.mission_category?.sort_no ?? 0),
  );

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const title = row.mission_category?.category_title;
    if (!title) continue;
    const titles = map.get(row.mission_id) ?? [];
    titles.push(title);
    map.set(row.mission_id, titles);
  }
  return map;
}

/**
 * ミッションのカテゴリ紐付けを、選ばれた状態に合わせる。
 *
 * 差分だけを触る。全消し＆再作成にすると、変更していないカテゴリの
 * `sort_no`（カテゴリ内の並び順）まで失われてしまう。
 */
export async function setMissionCategories(
  adminSupabase: SupabaseClient<Database>,
  missionId: string,
  categoryIds: readonly string[],
): Promise<{ error?: string }> {
  const current = await getCategoryIdsForMission(adminSupabase, missionId);
  const { toAdd, toRemove } = diffCategoryIds(current, categoryIds);

  if (toRemove.length > 0) {
    const { error } = await adminSupabase
      .from("mission_category_link")
      .delete()
      .eq("mission_id", missionId)
      .in("category_id", toRemove);

    if (error) {
      console.error("カテゴリの解除に失敗:", error);
      return { error: "カテゴリの解除に失敗しました" };
    }
  }

  if (toAdd.length === 0) return {};

  // 追加先カテゴリの現在の並び順を見て、末尾に置く
  const { data: siblings, error: siblingError } = await adminSupabase
    .from("mission_category_link")
    .select("category_id, sort_no")
    .in("category_id", toAdd);

  if (siblingError) {
    console.error("カテゴリ内の並び順の取得に失敗:", siblingError);
    return { error: "カテゴリの設定に失敗しました" };
  }

  const sortNosByCategory = new Map<string, number[]>();
  for (const row of siblings ?? []) {
    const list = sortNosByCategory.get(row.category_id) ?? [];
    list.push(row.sort_no);
    sortNosByCategory.set(row.category_id, list);
  }

  const { error } = await adminSupabase.from("mission_category_link").insert(
    toAdd.map((categoryId) => ({
      mission_id: missionId,
      category_id: categoryId,
      sort_no: nextSortNo(sortNosByCategory.get(categoryId) ?? []),
    })),
  );

  if (error) {
    console.error("カテゴリの設定に失敗:", error);
    return { error: "カテゴリの設定に失敗しました" };
  }

  return {};
}

/** 複製元のカテゴリ紐付けを複製先へコピーする */
export async function copyMissionCategories(
  adminSupabase: SupabaseClient<Database>,
  sourceMissionId: string,
  targetMissionId: string,
): Promise<{ error?: string }> {
  const categoryIds = await getCategoryIdsForMission(
    adminSupabase,
    sourceMissionId,
  );
  if (categoryIds.length === 0) return {};

  return setMissionCategories(adminSupabase, targetMissionId, categoryIds);
}
