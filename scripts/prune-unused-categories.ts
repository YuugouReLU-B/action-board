#!/usr/bin/env tsx

// 実行例:
// npx tsx scripts/prune-unused-categories.ts --dry-run
// npx tsx scripts/prune-unused-categories.ts
//
// mission_data/categories.yaml に無いカテゴリ（移植元のteam-mirai-volunteer/action-board
// から引き継いだ未使用カテゴリ）をDBから削除する。mission:sync は挿入のみで削除を
// 行わないため、この一度きりのクリーンアップスクリプトで対応する。
//
// 安全装置: ミッションが1件でも紐付いているカテゴリは絶対に削除しない
// （--force を付けても削除しない。使われているカテゴリを消す事故を防ぐため）。

import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";
import dotenv from "dotenv";
import * as yaml from "js-yaml";
import { createAdminClient } from "@/lib/supabase/adminClient";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const program = new Command();
program
  .name("prune-unused-categories")
  .description(
    "mission_data/categories.yaml に無い未使用カテゴリをDBから削除する",
  )
  .option("--dry-run", "削除対象を表示するだけで実際には削除しない", false)
  .parse(process.argv);

const { dryRun } = program.opts<{ dryRun: boolean }>();

type CategoryYaml = { slug: string; title: string };

function loadKeepSlugs(): string[] {
  const filePath = path.join(process.cwd(), "mission_data/categories.yaml");
  const content = fs.readFileSync(filePath, "utf8");
  const data = yaml.load(content) as { categories: CategoryYaml[] };
  return data.categories.map((c) => c.slug);
}

(async () => {
  const keepSlugs = loadKeepSlugs();
  console.log(
    `categories.yaml に定義されているカテゴリ: ${keepSlugs.join(", ")}`,
  );

  const supabase = await createAdminClient();

  const { data: allCategories, error: categoriesError } = await supabase
    .from("mission_category")
    .select("id, slug, category_title");
  if (categoriesError) {
    console.error("カテゴリ一覧の取得に失敗:", categoriesError);
    process.exit(1);
  }

  const candidates = (allCategories ?? []).filter(
    (c) => !keepSlugs.includes(c.slug),
  );

  if (candidates.length === 0) {
    console.log("\n削除候補のカテゴリはありません。");
    return;
  }

  const { data: links, error: linksError } = await supabase
    .from("mission_category_link")
    .select("category_id")
    .in(
      "category_id",
      candidates.map((c) => c.id),
    )
    .eq("del_flg", false);
  if (linksError) {
    console.error("カテゴリ紐付けの取得に失敗:", linksError);
    process.exit(1);
  }

  const linkedCategoryIds = new Set((links ?? []).map((l) => l.category_id));

  const deletable = candidates.filter((c) => !linkedCategoryIds.has(c.id));
  const blocked = candidates.filter((c) => linkedCategoryIds.has(c.id));

  console.log(
    `\n削除候補: 全${candidates.length}件中 ${deletable.length}件が削除可能（ミッション未紐付け）`,
  );
  for (const c of deletable) {
    console.log(`  - ${c.slug}: ${c.category_title}`);
  }

  if (blocked.length > 0) {
    console.log(
      `\n⚠️ ミッションが紐付いているため削除しない（${blocked.length}件）:`,
    );
    for (const c of blocked) {
      console.log(`  - ${c.slug}: ${c.category_title}`);
    }
  }

  if (dryRun) {
    console.log("\n[DRY RUN] ここでは削除しません");
    return;
  }

  if (deletable.length === 0) {
    console.log("\n削除できるカテゴリはありませんでした。");
    return;
  }

  const { error, count } = await supabase
    .from("mission_category")
    .delete({ count: "exact" })
    .in(
      "id",
      deletable.map((c) => c.id),
    );
  if (error) {
    console.error("mission_category の削除に失敗:", error);
    process.exit(1);
  }
  console.log(`\n✅ mission_category ${count ?? 0}件を削除しました`);
})();
