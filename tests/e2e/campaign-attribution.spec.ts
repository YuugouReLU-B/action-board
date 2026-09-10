import { expect, test } from "@playwright/test";

const CAMPAIGN_COOKIE = "campaign_code";

/**
 * CampaignCodeHandler（クライアントコンポーネント）がハイドレーション後に
 * URL から ?cv= を除去するまで待つ
 */
async function waitForCampaignParamRemoval(
  page: import("@playwright/test").Page,
) {
  await page.waitForFunction(
    () => !window.location.search.includes("cv="),
    undefined,
    { timeout: 20000 },
  );
}

test.describe("キャンペーンコード（?cv=）アトリビューション", () => {
  test("?cv= 付きURLで着地するとcookieに保存され、URLからパラメータが消える", async ({
    page,
  }) => {
    await page.goto("/?cv=e2e-campaign-cookie", { timeout: 20000 });

    await waitForCampaignParamRemoval(page);

    const cookies = await page.context().cookies();
    const campaignCookie = cookies.find((c) => c.name === CAMPAIGN_COOKIE);
    expect(campaignCookie?.value).toBe("e2e-campaign-cookie");
  });

  test("形式が不正なコードはcookieに保存されない", async ({ page }) => {
    // 空白と記号を含む不正なコード
    await page.goto("/?cv=bad%20code%21", { timeout: 20000 });

    await waitForCampaignParamRemoval(page);

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === CAMPAIGN_COOKIE)).toBeUndefined();
  });
});
