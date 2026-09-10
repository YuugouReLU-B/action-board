import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

/**
 * 新規登録直後に取り組んでもらう最初のミッション。
 *
 * MTG で「公式LINE友だち追加を初回チュートリアルに」と決まったため、
 * そのミッションを指す。
 */
const FIRST_MISSION_SLUG = "add-supporter-line-friend";

/**
 * 登録直後の遷移先を返す。
 *
 * `bot_prompt` によりログインと同時に友だち追加した人は、この時点で
 * 既に最初のミッションを達成している。そこへ送ると「達成しました！」だけが
 * 表示され、自分では何もしていないのに終わった画面になってしまう。
 *
 * - まだ達成していない → 友だち追加ミッションへ（本来の初回クエスト）
 * - すでに達成している → 未達成のミッションのうち一番おすすめのものへ
 * - 候補が無い         → トップへ
 *
 * SupabaseClient は引数で受け取る。内部で組み立てるとテストから呼べず、
 * 失敗しても握りつぶして "/" を返すだけなので気づけない。
 */
export async function getFirstMissionPath(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  try {
    const { data: achieved } = await supabase
      .from("achievements")
      .select("mission_id")
      .eq("user_id", userId);
    const achievedIds = new Set(
      (achieved ?? []).map((a) => a.mission_id).filter(Boolean),
    );

    const { data: firstMission } = await supabase
      .from("missions")
      .select("id, slug")
      .eq("slug", FIRST_MISSION_SLUG)
      .eq("is_hidden", false)
      .maybeSingle();

    if (firstMission && !achievedIds.has(firstMission.id)) {
      return `/missions/${firstMission.slug}`;
    }

    // 一覧と同じ並び（注目 → 注目度の高い順）で、まだ達成していないものを選ぶ。
    // 繰り返し達成できるミッションも一度やったら候補から外すが、
    // 登録直後の利用者は達成が高々1件なので実害はない。
    const { data: candidates } = await supabase
      .from("missions")
      .select("id, slug")
      .eq("is_hidden", false)
      .order("is_featured", { ascending: false })
      .order("featured_importance", { ascending: false, nullsFirst: false })
      .order("difficulty", { ascending: true });

    const next = (candidates ?? []).find((m) => !achievedIds.has(m.id));

    return next ? `/missions/${next.slug}` : "/";
  } catch (error) {
    console.warn("最初のミッションの取得に失敗:", error);
    return "/";
  }
}
