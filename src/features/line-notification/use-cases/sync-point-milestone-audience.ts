import type { SupabaseClient } from "@supabase/supabase-js";
import { LINE_FRIEND_METADATA_KEY } from "@/features/auth/utils/line-friend";
import type { Database } from "@/lib/types/supabase";
import { LineAudienceClientImpl } from "../services/line-audience-client";
import type { LineAudienceClient } from "../types/line-audience-client";
import { shouldSyncPointMilestoneAudience } from "../utils/point-milestone";

function buildDefaultAudienceClient(): LineAudienceClient | null {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const audienceGroupId = process.env.LINE_MILESTONE_AUDIENCE_GROUP_ID;
  if (!channelAccessToken || !audienceGroupId) return null;
  return new LineAudienceClientImpl(channelAccessToken, audienceGroupId);
}

/**
 * サービス層の getCurrentSeasonId() は createAdminClient() に依存するため、
 * ユースケースでは渡されたクライアントを直接使う（achieve-mission.ts と同じ理由）。
 */
async function fetchCurrentSeasonId(
  supabase: SupabaseClient<Database>,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching current season:", error);
    return null;
  }
  return data?.id ?? null;
}

/**
 * 累計ポイントが閾値に到達したユーザーを、LINE公式アカウントのオーディエンスへ追加する。
 *
 * 実際のメッセージ配信は行わない。配信文言・タイミングは運営がLINE公式アカウント
 * 管理画面から、このオーディエンスを対象に手動で行う想定。
 *
 * LINEの友だちでない（またはブロック中の）ユーザーには追加しても配信できないため、
 * 静かにスキップする。友だちになった後の次回チェックで追加される。
 *
 * 付帯処理なので、失敗してもページ表示自体は止めない。
 *
 * @param audienceClient テスト用の差し替え。省略時は環境変数から実クライアントを組み立てる
 */
export async function syncPointMilestoneAudience(
  adminSupabase: SupabaseClient<Database>,
  userId: string,
  audienceClient?: LineAudienceClient,
): Promise<void> {
  try {
    const client = audienceClient ?? buildDefaultAudienceClient();
    if (!client) {
      // 未設定の環境（ローカル開発等）では何もしない
      return;
    }

    const seasonId = await fetchCurrentSeasonId(adminSupabase);
    if (!seasonId) return;

    const { data: userLevel } = await adminSupabase
      .from("user_levels")
      .select("xp, line_1000pt_audience_added_at")
      .eq("user_id", userId)
      .eq("season_id", seasonId)
      .maybeSingle();

    if (!userLevel) return;

    if (
      !shouldSyncPointMilestoneAudience(
        userLevel.xp,
        userLevel.line_1000pt_audience_added_at,
      )
    ) {
      return;
    }

    const { data: userResult, error: userError } =
      await adminSupabase.auth.admin.getUserById(userId);
    if (userError || !userResult.user) return;

    const metadata = (userResult.user.user_metadata ?? {}) as Record<
      string,
      unknown
    >;
    const lineUserId = metadata.line_user_id as string | undefined;
    const isOfficialAccountFriend = metadata[LINE_FRIEND_METADATA_KEY];

    if (!lineUserId || isOfficialAccountFriend !== true) {
      // LINE未連携、または友だちでない（判定不可含む）ユーザーは静かにスキップ
      return;
    }

    await client.addUserId(lineUserId);

    await adminSupabase
      .from("user_levels")
      .update({ line_1000pt_audience_added_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("season_id", seasonId);
  } catch (error) {
    console.warn("LINEオーディエンスへの追加でエラー:", error);
  }
}
