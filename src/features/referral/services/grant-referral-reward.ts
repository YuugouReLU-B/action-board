import { grantMissionCompletionXp } from "@/features/user-level/services/level";
import { getCurrentSeasonId } from "@/lib/services/seasons";
import { createAdminClient } from "@/lib/supabase/adminClient";
import {
  isEmailAlreadyUsedInReferral,
  isValidReferralCode,
} from "@/lib/validation/referral";

/**
 * 紹介コード経由の新規登録に対して、紹介した側のミッションを達成扱いにする。
 *
 * 付帯処理のため、失敗しても登録フロー自体は止めない（警告ログのみ）。
 * 以前は src/app/actions.ts 内のプライベート関数だったが、
 * LINEコールバックのルートハンドラからも呼ぶため切り出した。
 */
export async function grantReferralReward(referralCode: string, email: string) {
  const serviceSupabase = await createAdminClient();

  try {
    // 紹介コードの検証
    const [isValid, isDuplicate] = await Promise.all([
      isValidReferralCode(referralCode),
      isEmailAlreadyUsedInReferral(email?.toLowerCase() ?? ""),
    ]);

    if (isValid && !isDuplicate) {
      const { data: mission } = await serviceSupabase
        .from("missions")
        .select("id")
        .eq("required_artifact_type", "REFERRAL")
        .maybeSingle();

      const { data: referrerRecord } = await serviceSupabase
        .from("user_referral")
        .select("user_id")
        .eq("referral_code", referralCode)
        .maybeSingle();

      if (mission && referrerRecord?.user_id) {
        const { data: achievement, error: achievementError } =
          await serviceSupabase
            .from("achievements")
            .insert({
              user_id: referrerRecord.user_id,
              mission_id: mission.id,
              season_id: await getCurrentSeasonId(),
            })
            .select("id")
            .single();

        if (achievement && !achievementError) {
          await serviceSupabase.from("mission_artifacts").insert({
            user_id: referrerRecord.user_id,
            achievement_id: achievement.id,
            artifact_type: "REFERRAL",
            text_content: email.toLowerCase(),
          });

          // XP付与
          await grantMissionCompletionXp(
            referrerRecord.user_id,
            mission.id,
            achievement.id,
          );
        }
      }
    }
  } catch (error) {
    console.warn("紹介コード処理エラー:", error);
  }
}
