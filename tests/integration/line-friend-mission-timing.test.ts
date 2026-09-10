import { grantLineFriendMission } from "@/features/auth/use-cases/grant-line-friend-mission";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";
import { adminClient, cleanupTestUser, createTestUser } from "./utils";

/**
 * 公式LINE友だち追加ミッションの自動達成。
 *
 * LINEログインのコールバックで、**プロフィール登録より前に**呼ばれる。
 * 新規登録の時点では public_user_profiles がまだ無いので、
 * ここが profiles を参照していると外部キー違反で静かに失敗する
 * （付帯処理として例外を握りつぶす作りのため、誰も気づかない）。
 *
 * 現在は achievements / xp_transactions / user_levels いずれも
 * auth.users を参照しているので成立する。プロフィール側に張り替えると
 * 「登録と同時に友だちだった人だけ達成できない」という分かりにくい壊れ方を
 * するため、ここで固定しておく。
 */
describe("友だち追加ミッションの自動達成", () => {
  const userIds: string[] = [];
  let missionId: string;

  beforeAll(async () => {
    const { data } = await adminClient
      .from("missions")
      .select("id")
      .eq("required_artifact_type", ARTIFACT_TYPES.LINE_FRIEND.key)
      .eq("is_hidden", false)
      .maybeSingle();
    if (!data) {
      throw new Error("公式LINE友だち追加ミッションが見つかりません");
    }
    missionId = data.id;
  });

  afterAll(async () => {
    for (const userId of userIds) {
      await adminClient.from("achievements").delete().eq("user_id", userId);
      await cleanupTestUser(userId);
    }
  });

  async function countAchievements(userId: string) {
    const { count } = await adminClient
      .from("achievements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("mission_id", missionId);
    return count ?? 0;
  }

  test("プロフィール未登録でも達成でき、XPも入る（登録直後の状態）", async () => {
    const { user, client } = await createTestUser();
    userIds.push(user.userId);

    // 新規登録直後を再現する
    await adminClient
      .from("public_user_profiles")
      .delete()
      .eq("id", user.userId);

    await grantLineFriendMission(adminClient, client, user.userId);

    expect(await countAchievements(user.userId)).toBe(1);

    const { data: xp } = await adminClient
      .from("xp_transactions")
      .select("xp_amount")
      .eq("user_id", user.userId);
    expect(xp?.length).toBe(1);
    expect(xp?.[0].xp_amount).toBeGreaterThan(0);
  });

  test("二度呼んでも二重に達成しない", async () => {
    const { user, client } = await createTestUser();
    userIds.push(user.userId);

    await grantLineFriendMission(adminClient, client, user.userId);
    await grantLineFriendMission(adminClient, client, user.userId);

    expect(await countAchievements(user.userId)).toBe(1);
  });
});
