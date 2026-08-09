import { startLineLogin } from "./start-line-login";

const setCookieMock = jest.fn();

jest.mock("@/lib/utils/server-cookies", () => ({
  setCookie: (...args: unknown[]) => setCookieMock(...args),
}));

jest.mock("@/lib/constants/app-origin", () => ({
  LINE_REDIRECT_URI: "https://example.com/api/auth/line-callback",
}));

describe("startLineLogin", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    setCookieMock.mockReset();
    // .env の値を引き継ぐとテストが環境依存になるため、明示的に初期化する
    process.env = { ...originalEnv, NEXT_PUBLIC_LINE_CLIENT_ID: "test-client" };
    process.env.NEXT_PUBLIC_LINE_BOT_PROMPT = undefined;
    delete process.env.NEXT_PUBLIC_LINE_BOT_PROMPT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const getUrl = (result: Awaited<ReturnType<typeof startLineLogin>>) => {
    if (!result.success) throw new Error("expected success");
    return new URL(result.authorizeUrl);
  };

  test("authorize URL に必要なパラメータが揃っている", async () => {
    const url = getUrl(await startLineLogin());

    expect(url.origin + url.pathname).toBe(
      "https://access.line.me/oauth2/v2.1/authorize",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("test-client");
    expect(url.searchParams.get("state")).toBeTruthy();
  });

  test("redirect_uri は APP_ORIGIN 由来の固定値を使う", async () => {
    // authorize 時と token 交換時で redirect_uri がズレると
    // LINE 側が invalid_grant を返すため、両者が同じ定数を参照している必要がある
    const url = getUrl(await startLineLogin());

    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://example.com/api/auth/line-callback",
    );
  });

  test("scope に email を含めない", async () => {
    const url = getUrl(await startLineLogin());

    expect(url.searchParams.get("scope")).toBe("profile openid");
  });

  test("state を HttpOnly cookie に保存する", async () => {
    const url = getUrl(await startLineLogin());
    const state = url.searchParams.get("state");

    const stateCall = setCookieMock.mock.calls.find(
      ([name]) => name === "line_login_state",
    );
    expect(stateCall).toBeDefined();
    expect(stateCall?.[1]).toBe(state);
    expect(stateCall?.[2]).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });

  test("state は呼び出しごとに異なる", async () => {
    const first = getUrl(await startLineLogin()).searchParams.get("state");
    const second = getUrl(await startLineLogin()).searchParams.get("state");

    expect(first).not.toBe(second);
  });

  test("生年月日が渡された場合のみ cookie に保存する", async () => {
    await startLineLogin({ dateOfBirth: "1990-01-15" });
    expect(
      setCookieMock.mock.calls.find(([name]) => name === "line_login_dob")?.[1],
    ).toBe("1990-01-15");

    setCookieMock.mockReset();
    await startLineLogin();
    expect(
      setCookieMock.mock.calls.find(([name]) => name === "line_login_dob"),
    ).toBeUndefined();
  });

  test("外部URLはreturnUrlとして保存しない（オープンリダイレクト対策）", async () => {
    await startLineLogin({ returnUrl: "https://evil.example.com/steal" });

    expect(
      setCookieMock.mock.calls.find(([name]) => name === "line_login_return"),
    ).toBeUndefined();
  });

  test("内部パスはreturnUrlとして保存する", async () => {
    await startLineLogin({ returnUrl: "/missions/foo" });

    expect(
      setCookieMock.mock.calls.find(
        ([name]) => name === "line_login_return",
      )?.[1],
    ).toBe("/missions/foo");
  });

  test("NEXT_PUBLIC_LINE_BOT_PROMPT 未設定なら bot_prompt を付けない", async () => {
    // 公式アカウント未リンクの状態で bot_prompt を付けると動かないため、
    // 明示的に設定されたときだけ付与する
    const url = getUrl(await startLineLogin());

    expect(url.searchParams.get("bot_prompt")).toBeNull();
  });

  test("bot_prompt=aggressive を設定すると authorize URL に付く", async () => {
    process.env.NEXT_PUBLIC_LINE_BOT_PROMPT = "aggressive";
    const url = getUrl(await startLineLogin());

    expect(url.searchParams.get("bot_prompt")).toBe("aggressive");
  });

  test("不正な bot_prompt の値は無視する", async () => {
    process.env.NEXT_PUBLIC_LINE_BOT_PROMPT = "yes-please";
    const url = getUrl(await startLineLogin());

    expect(url.searchParams.get("bot_prompt")).toBeNull();
  });

  test("client_id 未設定ならエラーを返す", async () => {
    process.env.NEXT_PUBLIC_LINE_CLIENT_ID = "";
    const result = await startLineLogin();

    expect(result.success).toBe(false);
  });
});
