#!/usr/bin/env tsx

// 実行例:
// npx dotenv -e .env.production.local -- npx tsx scripts/find-duplicate-missions.ts
//
// 読み取り専用の調査スクリプト。何も削除・変更しない。
//
// 「ポイントが2倍になって重複している」ミッションを見つけるため、
// タイトルが同じ/似ているミッションと、同じミッションが複数のカテゴリに
// 二重に紐付いているケースの両方を洗い出す。

import path from "node:path";
import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/adminClient";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

(async () => {
  const supabase = await createAdminClient();

  const { data: missions, error } = await supabase
    .from("missions")
    .select("id, slug, title, points, is_hidden, is_featured, created_at");
  if (error) {
    console.error("ミッション一覧の取得に失敗:", error);
    process.exit(1);
  }

  console.log(`全ミッション数: ${missions?.length ?? 0}\n`);

  // 1. タイトルが完全一致するもの
  const byTitle = new Map<string, typeof missions>();
  for (const m of missions ?? []) {
    const key = m.title.trim();
    byTitle.set(key, [...(byTitle.get(key) ?? []), m]);
  }
  const duplicateTitles = Array.from(byTitle.entries()).filter(
    ([, list]) => list.length > 1,
  );

  console.log(
    `■ タイトルが完全一致するミッション: ${duplicateTitles.length}組`,
  );
  for (const [title, list] of duplicateTitles) {
    console.log(`\n  「${title}」 (${list.length}件)`);
    for (const m of list) {
      console.log(
        `    - id=${m.id} slug=${m.slug} points=${m.points} hidden=${m.is_hidden} featured=${m.is_featured} created=${m.created_at}`,
      );
    }
  }

  // 2. 同じミッションが複数カテゴリに紐付いている（一覧に2回出て2回達成できてしまう可能性）
  const { data: links, error: linksError } = await supabase
    .from("mission_category_link")
    .select("mission_id, category_id, del_flg")
    .eq("del_flg", false);
  if (linksError) {
    console.error("カテゴリ紐付けの取得に失敗:", linksError);
    process.exit(1);
  }

  const linkCountByMission = new Map<string, number>();
  for (const l of links ?? []) {
    linkCountByMission.set(
      l.mission_id,
      (linkCountByMission.get(l.mission_id) ?? 0) + 1,
    );
  }
  const multiLinked = Array.from(linkCountByMission.entries()).filter(
    ([, count]) => count > 1,
  );

  console.log(
    `\n■ 複数カテゴリに紐付いているミッション: ${multiLinked.length}件`,
  );
  for (const [missionId, count] of multiLinked) {
    const m = missions?.find((mm) => mm.id === missionId);
    console.log(
      `  - ${m ? `${m.title} (slug=${m.slug}, points=${m.points})` : missionId}: ${count}カテゴリに紐付け`,
    );
  }

  if (duplicateTitles.length === 0 && multiLinked.length === 0) {
    console.log("\n重複らしきものは見つかりませんでした。");
  }
})();
