import type {
  LineApiClient,
  LineTokenResponse,
} from "../types/line-api-client";

export class LineApiClientImpl implements LineApiClient {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<LineTokenResponse> {
    const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to get access token: ${response.status} ${errorBody}`,
      );
    }

    return response.json();
  }

  async getFriendshipStatus(accessToken: string): Promise<boolean | null> {
    try {
      const response = await fetch("https://api.line.me/friendship/v1/status", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        // 公式アカウント未リンク時などは 4xx が返る。
        // 友だち状態は付帯情報なのでログインは続行させる
        console.warn(
          `友だち状態の取得に失敗: ${response.status} ${await response.text()}`,
        );
        return null;
      }

      const data = (await response.json()) as { friendFlag?: boolean };
      return data.friendFlag ?? null;
    } catch (error) {
      console.warn("友だち状態の取得でエラー:", error);
      return null;
    }
  }
}
