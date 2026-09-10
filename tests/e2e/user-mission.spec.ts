import { assertAuthState, expect, test } from "../e2e-test-helpers";

test.describe("アクションボード（Web版）のe2eテスト", () => {
  test("ログイン済み状態からトップページ確認", async ({ signedInPage }) => {
    await assertAuthState(signedInPage, true);

    // 自身のステータス表示を確認（レベル表示は廃止し、ポイント数のみ表示）
    await expect(
      signedInPage
        .locator("section")
        .getByText("テストユーザー東京都0 ポイント"),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      signedInPage.getByRole("link", {
        name: "テストユーザーさんのプロフィールへ",
      }),
    ).toBeVisible();

    // 活動状況の表示を確認
    await expect(
      signedInPage.getByRole("heading", { name: /浜通りクエストの活動状況/ }),
    ).toBeVisible();
    await expect(signedInPage.getByText("登録者数")).toBeVisible();

    // 注目ミッションの表示を確認
    await expect(
      signedInPage.getByRole("heading", { name: /注目ミッション/ }),
    ).toBeVisible();

    // 活動タイムラインの表示を確認
    await expect(
      signedInPage.getByRole("heading", { name: /活動タイムライン/ }),
    ).toBeVisible();

    // 問い合わせフォームの表示を確認
    await expect(
      signedInPage.getByRole("heading", { name: "ご意見箱" }),
    ).toBeVisible();
    // ご意見箱はポスターマップ分と統合され、1本のリンクになった
    await expect(
      signedInPage.getByRole("link", {
        name: "浜通りクエストへのご意見フォーム",
      }),
    ).toBeVisible();

    // フッターの表示を確認
    // 「運営組織」リンクは運営主体が確定するまでのあいだ削除されている
    await expect(
      signedInPage.getByRole("link", { name: "利用規約" }),
    ).toBeVisible();
    await expect(
      signedInPage.getByRole("link", { name: "プライバシーポリシー" }),
    ).toBeVisible();
    await expect(
      signedInPage.getByRole("link", { name: "ご意見箱" }),
    ).toBeVisible();
  });

  test("アカウント設定（マイページ下部）が正常に動作する", async ({
    signedInPage,
  }) => {
    await assertAuthState(signedInPage, true);

    // マイページに遷移（アイコン変更・ニックネーム編集・退会もここに統合されている）
    await signedInPage.getByTestId("usermenubutton").click();
    await signedInPage.getByRole("menuitem", { name: "マイページ" }).click();
    await expect(signedInPage).toHaveURL(/\/users\/[^/]+$/, {
      timeout: 10000,
    });

    // アカウント設定セクションの表示内容を確認（アイコン+ニックネームのみ）
    await expect(signedInPage.getByText("プロフィール設定")).toBeVisible();
    await expect(signedInPage.getByLabel("ニックネーム")).toBeVisible();
    await expect(
      signedInPage.getByRole("button", { name: "更新する" }),
    ).toBeVisible();

    // /settings/profile に直接アクセスしてもマイページへリダイレクトされる
    await signedInPage.goto("/settings/profile");
    await expect(signedInPage).toHaveURL(/\/users\/[^/]+$/, {
      timeout: 10000,
    });
  });

  test("ユーザーページ遷移が正常に動作する", async ({ signedInPage }) => {
    await assertAuthState(signedInPage, true);

    // 自身のユーザーページに遷移
    await signedInPage
      .getByRole("link", { name: "テストユーザーさんのプロフィールへ" })
      .click();
    await expect(signedInPage).toHaveURL(/\/users\/[^/]+$/, {
      timeout: 10000,
    });

    // 自身のユーザーページの表示内容を確認
    await expect(signedInPage.getByText("テストユーザー")).toBeVisible();
  });

  test("任意のユーザーページ遷移が正常に動作する", async ({ signedInPage }) => {
    await assertAuthState(signedInPage, true);

    // ランキングページ経由で任意のユーザーページに遷移する
    // （ホーム画面のランキングプレビューは廃止されたため、ランキングページへ移動してから探す）
    await signedInPage.goto("/ranking");
    await signedInPage.getByRole("button", { name: "全期間" }).click();
    await signedInPage
      .getByRole("link")
      .filter({ hasText: "佐藤太郎" })
      .first()
      .click();
    await expect(signedInPage).toHaveURL(/\/users\/[^/]+$/, {
      timeout: 10000,
    });

    // 任意のユーザーページの表示内容を確認
    await expect(signedInPage.getByText("佐藤太郎").first()).toBeVisible();
  });

  test("ミッションページ遷移 → ミッション完了 → ミッション取消が正常に動作する", async ({
    signedInPage,
  }) => {
    await assertAuthState(signedInPage, true);

    // ミッションページに遷移（ゴミ拾いミッションをクリック）
    await signedInPage
      .getByRole("article")
      .filter({ hasText: "(seed) ゴミ拾いをしよう (成果物不要)" })
      .getByRole("button", { name: "今すぐチャレンジ" })
      .click();
    await expect(signedInPage).toHaveURL(/\/missions\/[^/]+$/, {
      timeout: 10000,
    });

    // ミッションページの表示内容を確認
    await expect(
      signedInPage.getByRole("button", { name: "ミッション完了を記録する" }),
    ).toBeVisible();
    await expect(
      signedInPage.getByText(
        "※ 成果物の内容が認められない場合、ミッションの達成が取り消される場合があります。正確な内容をご記入ください。",
      ),
    ).toBeVisible();

    // ミッション完了ページに遷移
    await signedInPage
      .getByRole("button", { name: "ミッション完了を記録する" })
      .click();
    await expect(signedInPage.getByText("おめでとうございます！")).toBeVisible({
      timeout: 10000,
    });
    await signedInPage.getByRole("button", { name: "このまま閉じる" }).click();

    await expect(
      signedInPage.getByText("このミッションは何度でもチャレンジできます。"),
    ).toBeVisible();
    await expect(signedInPage.getByText("800ポイント獲得しました")).toBeVisible(
      { timeout: 10000 },
    );

    // ミッション完了後のポイントの変動を確認（レベル表示は廃止し、ポイント数のみ表示）
    await signedInPage.goto("/");
    await expect(
      signedInPage
        .locator("section")
        .getByText("テストユーザー東京都800 ポイント"),
    ).toBeVisible({ timeout: 10000 });

    await signedInPage.goto("/ranking");
    await signedInPage.getByRole("button", { name: "全期間" }).click();
    await expect(signedInPage.getByText("あなたのランク")).toBeVisible();
    // ランキング一覧では都道府県を表示しなくなった
    await expect(
      signedInPage
        .getByRole("link", {
          name: "テストユーザー Lv.9 800pt",
        })
        .first(),
    ).toBeVisible({ timeout: 10000 });

    // ミッション取消後のポイントの変動を確認
    await signedInPage.goto("/");
    await signedInPage
      .getByRole("button", { name: "もう一回チャレンジ" })
      .first()
      .click();
    await expect(signedInPage).toHaveURL(/\/missions\/[^/]+$/, {
      timeout: 10000,
    });

    await expect(signedInPage.getByText("あなたの達成履歴")).toBeVisible({
      timeout: 10000,
    });
    await signedInPage.getByRole("button", { name: "取り消す" }).click();

    await expect(
      signedInPage.getByText("達成履歴を削除しますか？"),
    ).toBeVisible({ timeout: 10000 });
    await signedInPage.getByRole("button", { name: "削除する" }).click();

    await signedInPage.waitForTimeout(2000);

    await signedInPage.goto("/");
    await expect(
      signedInPage
        .locator("section")
        .getByText("テストユーザー東京都0 ポイント"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("TOP100ランキング - 全タブ遷移が正常に動作する", async ({
    signedInPage,
  }) => {
    await assertAuthState(signedInPage, true);

    // ランキングページに遷移
    await signedInPage.getByRole("link", { name: "トップ100を見る" }).click();
    await expect(signedInPage).toHaveURL("/ranking", { timeout: 10000 });

    await expect(
      signedInPage.getByRole("heading", { name: "アクションリーダー" }),
    ).toBeVisible();
    await expect(
      signedInPage.getByRole("heading", { name: "今日のトップ100" }),
    ).toBeVisible();
    // TODO: Dailyランキングに表示されるseedデータを投入する必要あり //

    await signedInPage.getByRole("button", { name: "全期間" }).click();
    await expect(
      signedInPage.getByRole("heading", { name: "全期間トップ100" }),
    ).toBeVisible();

    // 都道府県別ランキングは導線を外したため、タブは「全体」「ミッション別」のみ
    await signedInPage.getByText("ミッション別").click();
    await expect(signedInPage).toHaveURL("/ranking/ranking-mission", {
      timeout: 10000,
    });

    await signedInPage.getByText("全体").click();
    await expect(signedInPage).toHaveURL("/ranking", { timeout: 10000 });
    await expect(
      signedInPage.getByRole("heading", { name: "アクションリーダー" }),
    ).toBeVisible();
  });
});
