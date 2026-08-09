import { createClient } from "@supabase/supabase-js";
import { issueQrCode } from "@/features/qr-spot/services/qr-code";
import { redeemQrSpot } from "@/features/qr-spot/use-cases/redeem-qr-spot";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";
import { adminClient, cleanupTestUser, createTestUser } from "./utils";

/**
 * QRスポットの獲得フロー。
 *
 * ここで一番守りたいのは「コードが anon から読めないこと」と
 * 「同じQRを何度読んでも二重に加算されないこと」の2点。
 */
describe("QRスポット", () => {
  const missionIds: string[] = [];
  const userIds: string[] = [];

  async function createQrMission(overrides: {
    slug: string;
    points?: number;
    isHidden?: boolean;
    maxAchievementCount?: number | null;
  }) {
    const id = crypto.randomUUID();
    const { error } = await adminClient.from("missions").insert({
      id,
      slug: overrides.slug,
      title: `テストスポット ${overrides.slug}`,
      content: "テスト用",
      difficulty: 1,
      points: overrides.points ?? 300,
      required_artifact_type: ARTIFACT_TYPES.QR.key,
      max_achievement_count:
        overrides.maxAchievementCount === undefined
          ? 1
          : overrides.maxAchievementCount,
      is_featured: false,
      is_hidden: overrides.isHidden ?? false,
    });
    if (error) throw new Error(`ミッション作成に失敗: ${error.message}`);
    missionIds.push(id);
    return id;
  }

  afterAll(async () => {
    for (const userId of userIds) {
      await cleanupTestUser(userId);
    }
    for (const missionId of missionIds) {
      await adminClient
        .from("achievements")
        .delete()
        .eq("mission_id", missionId);
      await adminClient.from("missions").delete().eq("id", missionId);
    }
  });

  test("anon キーでは mission_qr_codes を読めない", async () => {
    const missionId = await createQrMission({
      slug: `qr-secrecy-${Date.now()}`,
    });
    await issueQrCode(adminClient, missionId);

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    );

    const { data, error } = await anon.from("mission_qr_codes").select("code");

    // 権限が無いこと自体が要件。データが空で返るだけでは不十分
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  test("QRを読むとポイントが入り、2回目は加算されない", async () => {
    const missionId = await createQrMission({
      slug: `qr-redeem-${Date.now()}`,
      points: 300,
    });
    const issued = await issueQrCode(adminClient, missionId);
    if ("error" in issued) throw new Error(issued.error);

    const { user, client } = await createTestUser();
    userIds.push(user.userId);

    const first = await redeemQrSpot(
      adminClient,
      client,
      user.userId,
      issued.code,
    );
    expect(first.status).toBe("granted");
    if (first.status === "granted") {
      expect(first.xpGranted).toBe(300);
    }

    const second = await redeemQrSpot(
      adminClient,
      client,
      user.userId,
      issued.code,
    );
    expect(second.status).toBe("already");

    const { count } = await adminClient
      .from("achievements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .eq("mission_id", missionId);
    expect(count).toBe(1);
  });

  test("存在しないコードは invalid になる", async () => {
    const { user, client } = await createTestUser();
    userIds.push(user.userId);

    const result = await redeemQrSpot(
      adminClient,
      client,
      user.userId,
      "this-code-does-not-exist",
    );
    expect(result.status).toBe("invalid");
  });

  test("非表示のスポットは獲得できない", async () => {
    const missionId = await createQrMission({
      slug: `qr-hidden-${Date.now()}`,
      isHidden: true,
    });
    const issued = await issueQrCode(adminClient, missionId);
    if ("error" in issued) throw new Error(issued.error);

    const { user, client } = await createTestUser();
    userIds.push(user.userId);

    const result = await redeemQrSpot(
      adminClient,
      client,
      user.userId,
      issued.code,
    );
    expect(result.status).toBe("unavailable");

    const { count } = await adminClient
      .from("achievements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .eq("mission_id", missionId);
    expect(count).toBe(0);
  });

  test("コードを再発行すると古いコードでは獲得できなくなる", async () => {
    const missionId = await createQrMission({
      slug: `qr-reissue-${Date.now()}`,
    });
    const first = await issueQrCode(adminClient, missionId);
    if ("error" in first) throw new Error(first.error);

    const second = await issueQrCode(adminClient, missionId);
    if ("error" in second) throw new Error(second.error);
    expect(second.code).not.toBe(first.code);

    const { user, client } = await createTestUser();
    userIds.push(user.userId);

    const withOldCode = await redeemQrSpot(
      adminClient,
      client,
      user.userId,
      first.code,
    );
    expect(withOldCode.status).toBe("invalid");

    const withNewCode = await redeemQrSpot(
      adminClient,
      client,
      user.userId,
      second.code,
    );
    expect(withNewCode.status).toBe("granted");
  });
});
