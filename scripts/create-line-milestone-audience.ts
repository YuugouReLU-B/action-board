#!/usr/bin/env tsx

// 実行例（初回セットアップで1回だけ実行する）:
// npx tsx scripts/create-line-milestone-audience.ts
//
// LINE Messaging APIの「ユーザーID追加型」オーディエンスグループを新規作成する。
// 出力される audienceGroupId を LINE_MILESTONE_AUDIENCE_GROUP_ID として .env / 本番環境変数に設定すること。
// 以後のユーザー追加はアプリ側（syncPointMilestoneAudience）が自動で行う。

import path from "node:path";
import { Command } from "commander";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const program = new Command();

program
  .name("create-line-milestone-audience")
  .description(
    "累計ポイント到達ユーザー向けのLINEオーディエンスグループを新規作成するCLI（初回のみ実行）",
  )
  .option(
    "-d, --description <description>",
    "オーディエンスグループの説明（LINE公式アカウント管理画面に表示される）",
    "累計1000pt到達ユーザー",
  )
  .parse(process.argv);

const { description } = program.opts<{ description: string }>();

(async () => {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    console.error("❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
    process.exit(1);
  }

  console.log(`📤 オーディエンスグループを作成中: "${description}"`);
  const response = await fetch(
    "https://api.line.me/v2/bot/audienceGroup/upload",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({ description, isIfaAudience: false }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`❌ 作成失敗: ${response.status} ${errorBody}`);
    process.exit(1);
  }

  const result = (await response.json()) as { audienceGroupId: number };
  console.log("🎉 作成完了");
  console.log(`audienceGroupId = ${result.audienceGroupId}`);
  console.log(
    `\n.env / 本番環境変数に以下を設定してください:\nLINE_MILESTONE_AUDIENCE_GROUP_ID=${result.audienceGroupId}`,
  );
})();
