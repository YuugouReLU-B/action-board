import { grantLineFriendMission } from "@/features/auth/use-cases/grant-line-friend-mission";
import { getFirstMissionPath } from "@/features/missions/services/first-mission";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";
import { adminClient, cleanupTestUser, createTestUser } from "./utils";

/**
 * 登録直後の遷移先の分岐。
 *
 * ログインと同時に友だち追加した人は、この時点で既に最初のミッションを
 * 達成している。そこへ送ると「達成しました！」だけの画面になるので、
 * 未達成のミッションへ送り分ける。
 */
describe("登録直後の遷移先", () => {
  const userIds: string[] = [];
  let friendMissionSlug: string;

  beforeAll(async () => {
    const { data } = await adminClient
      .from("missions")
      .select("slug")
      .eq("required_artifact_type", ARTIFACT_TYPES.LINE_FRIEND.key)
      .eq("is_hidden", false)
      .maybeSingle();
    if (!data) {
      throw new Error("公式LINE友だち追加ミッションが見つかりません");
    }
    friendMissionSlug = data.slug;
  });

  afterAll(async () => {
    for (const userId of userIds) {
      await adminClient.from("achievements").delete().eq("user_id", userId);
      await cleanupTestUser(userId);
    }
  });

  test("友だち追加していなければ、友だち追加ミッションへ送る", async () => {
    const { user } = await createTestUser();
    userIds.push(user.userId);

    const path = await getFirstMissionPath(adminClient, user.userId);

    expect(path).toBe(`/missions/${friendMissionSlug}`);
  });

  test("登録と同時に友だち追加していたら、次のミッションへ送る", async () => {
    const { user, client } = await createTestUser();
    userIds.push(user.userId);

    await grantLineFriendMission(adminClient, client, user.userId);

    const path = await getFirstMissionPath(adminClient, user.userId);

    expect(path).toMatch(/^\/missions\//);
    // 達成済みのミッションへ送り返さない
    expect(path).not.toBe(`/missions/${friendMissionSlug}`);
  });

  test("送り先が公開中のミッションであること", async () => {
    const { user, client } = await createTestUser();
    userIds.push(user.userId);
    await grantLineFriendMission(adminClient, client, user.userId);

    const path = await getFirstMissionPath(adminClient, user.userId);
    const slug = path.replace("/missions/", "");

    const { data } = await adminClient
      .from("missions")
      .select("is_hidden")
      .eq("slug", slug)
      .single();

    expect(data?.is_hidden).toBe(false);
  });
});
