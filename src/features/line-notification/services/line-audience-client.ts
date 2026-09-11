import type { LineAudienceClient } from "../types/line-audience-client";

const ADD_USER_IDS_ENDPOINT = "https://api.line.me/v2/bot/audienceGroup/upload";

/**
 * LINE公式アカウントのオーディエンス管理API（Messaging API）クライアント。
 *
 * 事前にLINE Developersコンソール、またはこのAPIで作成済みの
 * 「ユーザーID追加型」オーディエンスグループが必要（audienceGroupId）。
 * ここではメッセージ配信は行わず、ユーザーIDの追加のみを行う。
 */
export class LineAudienceClientImpl implements LineAudienceClient {
  constructor(
    private readonly channelAccessToken: string,
    private readonly audienceGroupId: string,
  ) {}

  async addUserId(lineUserId: string): Promise<void> {
    const response = await fetch(ADD_USER_IDS_ENDPOINT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
      body: JSON.stringify({
        audienceGroupId: Number(this.audienceGroupId),
        audiences: [{ id: lineUserId }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to add user to LINE audience group: ${response.status} ${errorBody}`,
      );
    }
  }
}
