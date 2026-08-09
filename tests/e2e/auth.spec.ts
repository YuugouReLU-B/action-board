import { expect, test } from "../e2e-test-helpers";

test.describe("新しい認証フロー (Two-Step Signup)", () => {
  // 各テストの前に実行
  test.beforeEach(async ({ page }) => {
    // トップページに移動
    await page.goto("/");
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState("networkidle");
  });

  test("Two-Step Signup フェーズ1の年齢制限バリデーション", async ({
    page,
  }) => {
    // サインアップページに移動
    await page.goto("/sign-up");

    // 18歳未満の年齢を選択（現在から計算して18歳未満になる年を選択）
    const year = page.getByTestId("year_select");
    await year.press("Enter");
    // 18歳未満になる年を選択（利用可能な最新の年である年を動的に選択）
    // e.g. 2008年12月31日生まれは2026年現在まだ17歳
    const selectedYear = page.getByRole("option", {
      name: `${new Date().getFullYear() - 18}年`,
    });
    await selectedYear.click();

    const month = page.getByTestId("month_select");
    await month.press("Enter");
    const selectedMonth = page.getByRole("option", { name: "12月" });
    await selectedMonth.click();

    const day = page.getByTestId("day_select");
    await day.press("Enter");
    const selectedDay = page.getByRole("option", { name: "31日" });
    await selectedDay.click();

    // 利用規約・プライバシーポリシーに同意する
    await page.locator("#terms").click();

    // 年齢制限エラーメッセージが表示されることを確認（部分一致）
    await expect(
      page.getByText("18歳以上の方のみご登録いただけます", { exact: false }),
    ).toBeVisible();

    // 次へ進むボタンが無効化されていることを確認
    await expect(page.getByRole("button", { name: "次へ進む" })).toBeDisabled();
  });

  test("Two-Step Signup フェーズ1の同意チェックバリデーション", async ({
    page,
  }) => {
    // サインアップページに移動
    await page.goto("/sign-up");

    // 18歳以上の年齢を選択
    const year2 = page.getByTestId("year_select");
    await year2.press("Enter");
    await page.getByRole("option", { name: "2001年" }).click();

    const month2 = page.getByTestId("month_select");
    await month2.press("Enter");
    await page.getByRole("option", { name: "3月" }).click();

    const day2 = page.getByTestId("day_select");
    await day2.press("Enter");
    await page.getByRole("option", { name: "14日" }).click();

    // 利用規約・プライバシーポリシーに未同意
    // 次へ進むボタンが無効化されていることを確認
    await expect(page.getByRole("button", { name: "次へ進む" })).toBeDisabled();

    // 利用規約・プライバシーポリシーに同意
    await page.locator("#terms").click();

    // 次へ進むボタンが有効化されることを確認
    await expect(page.getByRole("button", { name: "次へ進む" })).toBeEnabled();
  });

  test("Two-Step Signupページの表示と入力検証", async ({ page }) => {
    // サインアップページに移動
    await page.goto("/sign-up");

    // 1. 必要な要素が表示されていることを確認
    await expect(
      page.getByRole("heading", { name: "アクションボードに登録" }),
    ).toBeVisible();
    await expect(
      page.getByText("生年月日（満18歳以上である必要があります）"),
    ).toBeVisible();
    await expect(page.getByRole("main").getByText("利用規約")).toBeVisible();
    await expect(
      page.getByRole("main").getByText("プライバシーポリシー"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "次へ進む" })).toBeVisible();
    await expect(page.getByRole("link", { name: "こちら" })).toBeVisible();

    // 2. 年齢・同意なしでは次へ進むボタンが無効化されていることを確認
    await expect(page.getByRole("button", { name: "次へ進む" })).toBeDisabled();

    // 3. 年齢のみ選択して無効化されていることを確認
    const year3 = page.getByTestId("year_select");
    await year3.press("Enter");
    await page.getByRole("option", { name: "2001年" }).click();

    const month3 = page.getByTestId("month_select");
    await month3.press("Enter");
    await page.getByRole("option", { name: "3月" }).click();

    const day3 = page.getByTestId("day_select");
    await day3.press("Enter");
    await page.getByRole("option", { name: "14日" }).click();

    await expect(page.getByRole("button", { name: "次へ進む" })).toBeDisabled();

    // 4. 利用規約・プライバシーポリシーに同意して有効化されることを確認
    await page.locator("#terms").click();
    await expect(page.getByRole("button", { name: "次へ進む" })).toBeEnabled();
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

    const year = page.getByTestId("year_select");
    await year.press("Enter");
    await page.getByRole("option", { name: "2001年" }).click();

    const month = page.getByTestId("month_select");
    await month.press("Enter");
    await page.getByRole("option", { name: "3月" }).click();

    const day = page.getByTestId("day_select");
    await day.press("Enter");
    await page.getByRole("option", { name: "14日" }).click();

    await page.locator("#terms").click();
    await page.getByRole("button", { name: "次へ進む" }).click();

    await expect(
      page.getByRole("button", { name: "LINEでアカウント作成" }),
    ).toBeVisible();

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
