import { createAdminClient } from "@/lib/supabase/adminClient";

/**
 * 新規登録直後に取り組んでもらう最初のミッション。
 *
 * MTG で「公式LINE友だち追加を初回チュートリアルに」と決まったため、
 * そのミッションを指す。存在しない・非表示になっている場合はトップへ戻す。
 */
const FIRST_MISSION_SLUG = "add-supporter-line-friend";

/**
 * 登録直後の遷移先を返す。
 *
 * 以前はプロフィール保存後にトップへ戻していたが、
 * 次に何をすればよいか分からない導線だった。
 */
export async function getFirstMissionPath(): Promise<string> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("missions")
      .select("slug")
      .eq("slug", FIRST_MISSION_SLUG)
      .eq("is_hidden", false)
      .maybeSingle();

    return data?.slug ? `/missions/${data.slug}` : "/";
  } catch (error) {
    console.warn("最初のミッションの取得に失敗:", error);
    return "/";
  }
}
