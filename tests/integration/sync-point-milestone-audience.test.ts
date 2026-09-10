import { LINE_FRIEND_METADATA_KEY } from "@/features/auth/utils/line-friend";
import type { LineAudienceClient } from "@/features/line-notification/types/line-audience-client";
import { syncPointMilestoneAudience } from "@/features/line-notification/use-cases/sync-point-milestone-audience";
import {
  cleanupTestUserLevel,
  initializeTestUserLevel,
} from "./mission-test-helpers";
import { adminClient, cleanupTestUser, createTestUser } from "./utils";

/**
 * 累計ポイント到達ユーザーをLINEオーディエンスへ追加する処理。
 * 実際のLINE APIは呼ばず、記録用のフェイクに差し替えてDBとの整合だけを検証する。
 */
describe("syncPointMilestoneAudience", () => {
  const userIds: string[] = [];

  afterAll(async () => {
    for (const userId of userIds) {
      await cleanupTestUserLevel(userId);
      await cleanupTestUser(userId);
    }
  });

  function createFakeAudienceClient() {
    const addedUserIds: string[] = [];
    const client: LineAudienceClient = {
      async addUserId(lineUserId: string) {
        addedUserIds.push(lineUserId);
      },
    };
    return { client, addedUserIds };
  }

  async function setupUser(params: {
    xp: number;
    lineUserId?: string;
    isFriend?: boolean;
  }) {
    const { user } = await createTestUser();
    userIds.push(user.userId);
    await initializeTestUserLevel(user.userId);

    const { data: season } = await adminClient
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();
    if (!season) throw new Error("アクティブシーズンが見つかりません");

    await adminClient
      .from("user_levels")
      .update({ xp: params.xp })
      .eq("user_id", user.userId)
      .eq("season_id", season.id);

    if (params.lineUserId !== undefined || params.isFriend !== undefined) {
      await adminClient.auth.admin.updateUserById(user.userId, {
        user_metadata: {
          line_user_id: params.lineUserId,
          [LINE_FRIEND_METADATA_KEY]: params.isFriend,
        },
      });
    }

    return { userId: user.userId, seasonId: season.id };
  }

  async function getAudienceAddedAt(userId: string, seasonId: string) {
    const { data } = await adminClient
      .from("user_levels")
      .select("line_1000pt_audience_added_at")
      .eq("user_id", userId)
      .eq("season_id", seasonId)
      .single();
    return data?.line_1000pt_audience_added_at ?? null;
  }

  test("閾値未満の場合は何もしない", async () => {
    const { userId, seasonId } = await setupUser({
      xp: 999,
      lineUserId: "U-below-threshold",
      isFriend: true,
    });
    const { client, addedUserIds } = createFakeAudienceClient();

    await syncPointMilestoneAudience(adminClient, userId, client);

    expect(addedUserIds).toEqual([]);
    expect(await getAudienceAddedAt(userId, seasonId)).toBeNull();
  });

  test("友だちでない場合は静かにスキップする", async () => {
    const { userId, seasonId } = await setupUser({
      xp: 1000,
      lineUserId: "U-not-friend",
      isFriend: false,
    });
    const { client, addedUserIds } = createFakeAudienceClient();

    await syncPointMilestoneAudience(adminClient, userId, client);

    expect(addedUserIds).toEqual([]);
    expect(await getAudienceAddedAt(userId, seasonId)).toBeNull();
  });

  test("LINE未連携の場合は静かにスキップする", async () => {
    const { userId, seasonId } = await setupUser({ xp: 1000 });
    const { client, addedUserIds } = createFakeAudienceClient();

    await syncPointMilestoneAudience(adminClient, userId, client);

    expect(addedUserIds).toEqual([]);
    expect(await getAudienceAddedAt(userId, seasonId)).toBeNull();
  });

  test("閾値到達かつ友だちの場合はオーディエンスへ追加し、DBに記録する", async () => {
    const { userId, seasonId } = await setupUser({
      xp: 1000,
      lineUserId: "U-reached-threshold",
      isFriend: true,
    });
    const { client, addedUserIds } = createFakeAudienceClient();

    await syncPointMilestoneAudience(adminClient, userId, client);

    expect(addedUserIds).toEqual(["U-reached-threshold"]);
    expect(await getAudienceAddedAt(userId, seasonId)).not.toBeNull();
  });

  test("二度呼んでも二重に追加しない", async () => {
    const { userId } = await setupUser({
      xp: 1000,
      lineUserId: "U-idempotent",
      isFriend: true,
    });
    const { client, addedUserIds } = createFakeAudienceClient();

    await syncPointMilestoneAudience(adminClient, userId, client);
    await syncPointMilestoneAudience(adminClient, userId, client);

    expect(addedUserIds).toEqual(["U-idempotent"]);
  });
});
