#!/usr/bin/env tsx

// 実行例（初回のみ・環境ごとに1回実行する想定）:
// npx tsx scripts/prune-missions-to-launch-list.ts --dry-run
// npx tsx scripts/prune-missions-to-launch-list.ts
//
// 浜通りクエストの運用計画（1000ptを目指す3ステップ）に無いミッション・
// カテゴリをDBから削除する。mission:sync は挿入のみで削除を行わないため、
// この一度きりのクリーンアップスクリプトで対応する。
//
// 削除順序（外部キー制約による）:
//   1. achievements（mission_idにNO ACTION制約があるため先に削除）
//      → mission_artifacts はCASCADEで追従
//   2. missions（mission_category_link/mission_main_links/mission_qr_codes/
//      mission_quiz_links/quiz_questions はCASCADEで追従）
//   3. mission_category（mission_category_link はCASCADEで追従）
//   4. quiz_questions / quiz_categories（全件。運用計画にクイズ系ミッションが
//      無いため丸ごと削除。missionsのCASCADEで消えなかった一般設問も含めて掃除）

import path from "node:path";
import { Command } from "commander";
import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/adminClient";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const KEEP_MISSION_SLUGS = [
  // supabase/seed.sql が投入するテスト用フィクスチャ（E2E/統合テストが依存）。
  // 運用計画には無いが、削除するとローカル/CI環境が壊れるため必ず保持する。
  "seed-cleanup",
  "seed-activity-blog",
  "seed-best-shot",
  "seed-local-treasure",
  "seed-date-mission-1",
  "seed-x-nickname",
  "add-supporter-line-friend",
  "visit-turtle-cycle",
  "visit-kawauchi-winery",
  "visit-noma-horse-village",
  "visit-fukudosha",
  "visit-zuzu-warehouse",
  "visit-tokichiro-gama",
  "visit-hotel-futabatei",
  "event-kawauchi-hillclimb",
  "event-kitaizumi-surfing",
  "event-hamadori-food-art",
  "event-hamafes",
  "event-kawauchi-winery-harvest",
  "event-kokai-chakai",
  "event-hamakaido-trail",
  "event-iwaki-cosplay",
  "event-kiwi-harvest",
  "event-haccoba-fukudosha-tokyo",
  "event-fukushima-hitono-kagayaki-tokyo",
];

const KEEP_CATEGORY_SLUGS = [
  "official-line-registration",
  "visit-checkpoints",
  "attend-events",
];

const program = new Command();
program
  .name("prune-missions-to-launch-list")
  .description(
    "運用計画（1000pt 3ステップ）に無いミッション・カテゴリ・クイズデータを削除する",
  )
  .option("--dry-run", "削除対象を表示するだけで実際には削除しない", false)
  .parse(process.argv);

const { dryRun } = program.opts<{ dryRun: boolean }>();

(async () => {
  const supabase = await createAdminClient();

  // 1. 削除対象ミッションの特定
  const { data: allMissions, error: missionsError } = await supabase
    .from("missions")
    .select("id, slug, title");
  if (missionsError) {
    console.error("ミッション一覧の取得に失敗:", missionsError);
    process.exit(1);
  }

  const missionsToDelete = (allMissions ?? []).filter(
    (m) => !KEEP_MISSION_SLUGS.includes(m.slug),
  );
  const missionIdsToDelete = missionsToDelete.map((m) => m.id);

  console.log(
    `ミッション: 全${allMissions?.length ?? 0}件中 ${missionsToDelete.length}件を削除対象`,
  );
  for (const m of missionsToDelete) {
    console.log(`  - ${m.slug}: ${m.title}`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] ここでは削除しません");
  } else if (missionIdsToDelete.length > 0) {
    // achievements は mission_id に NO ACTION 制約があるため先に削除
    const { error: achievementsError, count: achievementsCount } =
      await supabase
        .from("achievements")
        .delete({ count: "exact" })
        .in("mission_id", missionIdsToDelete);
    if (achievementsError) {
      console.error("achievements の削除に失敗:", achievementsError);
      process.exit(1);
    }
    console.log(`  achievements ${achievementsCount ?? 0}件を削除`);

    const { error: deleteMissionsError, count: missionsDeletedCount } =
      await supabase
        .from("missions")
        .delete({ count: "exact" })
        .in("id", missionIdsToDelete);
    if (deleteMissionsError) {
      console.error("missions の削除に失敗:", deleteMissionsError);
      process.exit(1);
    }
    console.log(`  missions ${missionsDeletedCount ?? 0}件を削除`);
  }

  // 2. 削除対象カテゴリの特定
  const { data: allCategories, error: categoriesError } = await supabase
    .from("mission_category")
    .select("id, slug, category_title");
  if (categoriesError) {
    console.error("カテゴリ一覧の取得に失敗:", categoriesError);
    process.exit(1);
  }

  const categoriesToDelete = (allCategories ?? []).filter(
    (c) => !KEEP_CATEGORY_SLUGS.includes(c.slug),
  );

  console.log(
    `\nカテゴリ: 全${allCategories?.length ?? 0}件中 ${categoriesToDelete.length}件を削除対象`,
  );
  for (const c of categoriesToDelete) {
    console.log(`  - ${c.slug}: ${c.category_title}`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] ここでは削除しません");
  } else if (categoriesToDelete.length > 0) {
    const { error, count } = await supabase
      .from("mission_category")
      .delete({ count: "exact" })
      .in(
        "id",
        categoriesToDelete.map((c) => c.id),
      );
    if (error) {
      console.error("mission_category の削除に失敗:", error);
      process.exit(1);
    }
    console.log(`  mission_category ${count ?? 0}件を削除`);
  }

  // 3. クイズデータの全削除（運用計画にクイズ系ミッションが無いため）
  console.log("\nクイズデータ（quiz_questions / quiz_categories）を全削除");
  if (dryRun) {
    const { count: questionsCount } = await supabase
      .from("quiz_questions")
      .select("*", { count: "exact", head: true });
    const { count: categoriesQuizCount } = await supabase
      .from("quiz_categories")
      .select("*", { count: "exact", head: true });
    console.log(
      `  [DRY RUN] quiz_questions ${questionsCount ?? 0}件 / quiz_categories ${categoriesQuizCount ?? 0}件を削除予定`,
    );
  } else {
    const { error: qErr, count: qCount } = await supabase
      .from("quiz_questions")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (qErr) {
      console.error("quiz_questions の削除に失敗:", qErr);
      process.exit(1);
    }
    console.log(`  quiz_questions ${qCount ?? 0}件を削除`);

    const { error: qcErr, count: qcCount } = await supabase
      .from("quiz_categories")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (qcErr) {
      console.error("quiz_categories の削除に失敗:", qcErr);
      process.exit(1);
    }
    console.log(`  quiz_categories ${qcCount ?? 0}件を削除`);
  }

  console.log("\n完了");
})();
