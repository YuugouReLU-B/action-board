import type { SupabaseClient } from "@supabase/supabase-js";
import { achieveMission } from "@/features/mission-detail/use-cases/achieve-mission";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";
import type { Database } from "@/lib/types/supabase";

/**
 * 公式アカウントの友だち追加ミッションを自動で達成させる。
 *
 * 自己申告ではなく LINE の friendFlag を根拠に達成させたいので、
 * ログイン時に友だちだと判明したタイミングでここを呼ぶ。
 * bot_prompt で登録と同時に友だち追加した人はその場で達成になり、
 * 後から追加した人はミッション画面の「追加を確認する」で
 * 再認証したときに達成になる。
 *
 * 付帯処理なので、失敗してもログイン自体は止めない。
 */
export async function grantLineFriendMission(
  adminSupabase: SupabaseClient<Database>,
  userSupabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  try {
    const { data: mission } = await adminSupabase
      .from("missions")
      .select("id")
      .eq("required_artifact_type", ARTIFACT_TYPES.LINE_FRIEND.key)
      .eq("is_hidden", false)
      .maybeSingle();

    if (!mission) return;

    const { data: season } = await adminSupabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!season) return;

    // 二重達成を防ぐ。max_achievement_count による制御もあるが、
    // ここは自動実行なので明示的に確認しておく
    const { data: existing } = await adminSupabase
      .from("achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("mission_id", mission.id)
      .eq("season_id", season.id)
      .maybeSingle();

    if (existing) return;

    const result = await achieveMission(adminSupabase, userSupabase, {
      userId,
      missionId: mission.id,
      artifactType: ARTIFACT_TYPES.LINE_FRIEND.key,
      artifactData: {
        missionId: mission.id,
        requiredArtifactType: ARTIFACT_TYPES.LINE_FRIEND.key,
      },
    });

    if (!result.success) {
      console.warn("友だち追加ミッションの自動達成に失敗:", result.error);
    }
  } catch (error) {
    console.warn("友だち追加ミッションの自動達成でエラー:", error);
  }
}
