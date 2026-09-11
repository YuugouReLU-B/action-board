import { expect, test } from "../e2e-test-helpers";

test.describe("新しい認証フロー (Two-Step Signup)", () => {
  // 各テストの前に実行
  test.beforeEach(async ({ page }) => {
    // トップページに移動
    await page.goto("/");
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState("networkidle");
  });

  test("規約に同意するまで登録ボタンは押せない", async ({ page }) => {
    await page.goto("/sign-up");

    const signUpButton = page.getByRole("button", {
      name: "LINEでアカウント作成",
    });

    await expect(signUpButton).toBeDisabled();

    await page.locator("#terms").click();
    await expect(signUpButton).toBeEnabled();
  });

  test("登録画面に生年月日の入力がない", async ({ page }) => {
    // 生年月日（公職選挙法の18歳以上確認）の取得を廃止したため、
    // 登録時に聞くのは規約同意だけになった
    await page.goto("/sign-up");

    await expect(
      page.getByRole("heading", { name: "浜通りクエストに登録" }),
    ).toBeVisible();
    await expect(page.getByTestId("year_select")).toHaveCount(0);
    await expect(page.getByText("18歳", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "次へ進む" })).toHaveCount(0);

    await expect(page.getByRole("main").getByText("利用規約")).toBeVisible();
    await expect(
      page.getByRole("main").getByText("プライバシーポリシー"),
    ).toBeVisible();
  });

  test("サインインページはLINEログインのみを表示する", async ({ page }) => {
    // サインインページに移動
    await page.goto("/sign-in");

    // 1. LINEログインボタンのみが表示されていることを確認
    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "LINEでログイン" }),
    ).toBeVisible();

    // 2. メールアドレス+パスワードのログインは /dev/login に分離済み
    await expect(
      page.getByText("メールアドレス", { exact: true }),
    ).toBeHidden();
    await expect(page.getByText("パスワード", { exact: true })).toBeHidden();
    await expect(
      page.getByRole("button", { name: "ログイン", exact: true }),
    ).toBeHidden();
    await expect(
      page.getByRole("link", { name: "パスワードを忘れた方" }),
    ).toBeHidden();
  });

  test("開発用ログインページでメールアドレスログインができる", async ({
    page,
  }) => {
    await page.goto("/dev/login");

    await expect(
      page.getByRole("heading", { name: "開発用ログイン" }),
    ).toBeVisible();

    // 不正な認証情報でエラーメッセージが表示されることを確認
    await page.fill('input[name="email"]', "nonexistent@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.getByRole("button", { name: "ログイン", exact: true }).click();

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test("LINEサインアップボタンから正しいauthorize URLへ遷移する", async ({
    page,
  }) => {
    // LINE への実通信は行わず、遷移先URLだけを検証する
    const captured: { url?: URL } = {};
    await page.route("https://access.line.me/**", async (route) => {
      captured.url = new URL(route.request().url());
      await route.fulfill({ status: 200, body: "stub" });
    });

    await page.goto("/sign-up");
    await page.locator("#terms").click();

    await page.getByRole("button", { name: "LINEでアカウント作成" }).click();

    await expect
      .poll(() => captured.url?.pathname, { timeout: 15000 })
      .toBe("/oauth2/v2.1/authorize");

    const params = captured.url?.searchParams;
    expect(params?.get("response_type")).toBe("code");
    expect(params?.get("state")).toBeTruthy();
    // 個人情報を増やさないため email スコープは要求しない
    expect(params?.get("scope")).toBe("profile openid");
    // authorize と token 交換で redirect_uri がズレると invalid_grant になる
    expect(params?.get("redirect_uri")).toContain("/api/auth/line-callback");

    // state はサーバー側で HttpOnly cookie に保存され、
    // ブラウザのJSからは読めない（旧実装は localStorage に置いていた）
    const cookies = await page.context().cookies();
    const stateCookie = cookies.find((c) => c.name === "line_login_state");
    expect(stateCookie?.httpOnly).toBe(true);
    expect(stateCookie?.value).toBe(params?.get("state"));

    const localStorageState = await page.evaluate(() =>
      localStorage.getItem("lineLoginState"),
    );
    expect(localStorageState).toBeNull();
  });

  test("stateが一致しないコールバックは拒否される", async ({ page }) => {
    // cookie を持たない状態で直接コールバックを叩く
    await page.goto("/api/auth/line-callback?code=dummy&state=forged");

    await expect(page).toHaveURL(/\/sign-in\?error=/);
    await expect(page.getByText(/認証状態が無効です/)).toBeVisible();
  });
});
