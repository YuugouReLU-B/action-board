import { redirect } from "next/navigation";
import { FirstMissionCelebration } from "@/features/missions/components/first-mission-celebration";
import { FirstMissionPrompt } from "@/features/missions/components/first-mission-prompt";
import { FIRST_MISSION_SLUGS } from "@/features/missions/components/first-missions";
import { getFirstMissionRecommendations } from "@/features/missions/services/first-mission-recommendations";
import { getMyUserLevel } from "@/features/user-level/services/level";
import { getUser } from "@/features/user-profile/services/profile";
import { createAdminClient } from "@/lib/supabase/adminClient";

/**
 * 新規登録直後（初回クエストクリア後）に表示する祝福画面。
 *
 * bot_prompt によりログインと同時に友だち追加が完了している想定だが、
 * 確認できなければ達成済みと偽らず、挑戦を促す案内（スキップ可）を出す。
 */
export default async function WelcomePage() {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const supabase = await createAdminClient();
  const firstMissionSlug = FIRST_MISSION_SLUGS[0];

  const { data: mission } = await supabase
    .from("missions")
    .select("id, title, icon_url, points, slug")
    .eq("slug", firstMissionSlug)
    .eq("is_hidden", false)
    .maybeSingle();

  if (!mission) {
    redirect("/");
  }

  const { data: achievement } = await supabase
    .from("achievements")
    .select("id")
    .eq("user_id", user.id)
    .eq("mission_id", mission.id)
    .maybeSingle();

  if (!achievement) {
    return <FirstMissionPrompt mission={mission} />;
  }

  const [recommendations, userLevel] = await Promise.all([
    getFirstMissionRecommendations(supabase, user.id),
    getMyUserLevel(),
  ]);

  return (
    <FirstMissionCelebration
      mission={mission}
      totalPoints={userLevel?.xp ?? mission.points}
      events={recommendations.events}
      spots={recommendations.spots}
    />
  );
}
