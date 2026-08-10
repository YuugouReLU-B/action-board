import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SP = "/private/tmp/claude-501/-Users-yuugou-dev-relu-action-board/7aa69d47-a729-42fa-9bd5-9cf298df78c5/scratchpad";
const ROOT = process.cwd();

const targets = [
  ["logo", "public/img/logo.png", 320],
  ["logo_shiro", "public/img/logo_shiro.png", 320],
  ["footer_logo", "public/img/footer_logo.webp", 320],
  ["ogp_default", "public/img/ogp-default.png", 720],
  ["ogp_mission_base", "public/img/ogp_mission_base.png", 720],
  ["ogp_mission_complete_base", "public/img/ogp_mission_complete_base.png", 720],
  ["hero_background", "public/img/hero-background.svg", 720],
  ["hero_people", "public/img/hero-people.svg", 720],
  ["onboarding_character", "public/img/onboarding/character.svg", 260],
  ["onboarding_welcome", "public/img/onboarding/welcome_master.svg", 320],
  ["onboarding_background", "public/img/onboarding/background.svg", 480],
  ["mission_fallback", "public/img/mission_fallback.svg", 200],
  ["icon_add_line_friend", "public/img/mission-icons/actionboard_icon_work_20250713_ol_add-line-friend.svg", 200],
  ["icon_join_event", "public/img/mission-icons/actionboard_icon_work_20250713_ol_join-event.svg", 200],
  ["icon_instagram", "public/img/mission-icons/actionboard_icon_work_20250713_ol_instagram-like.svg", 200],
  ["icon_x_post", "public/img/mission-icons/actionboard_icon_work_20250713_ol_x-post.svg", 200],
  ["icon_referral", "public/img/mission-icons/actionboard_icon_work_20250713_ol_referral.svg", 200],
  ["icon_facebook", "public/img/icon-facebook2x.png", 200],
  ["favicon_new", "src/app/icon.png", 160],
  ["upstream_ogp", `${SP}/upstream-ogp.png`, 720],
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [name, rel, width] of targets) {
  const file = rel.startsWith("/") ? rel : path.join(ROOT, rel);
  if (!fs.existsSync(file)) { console.log(`SKIP ${name} (ファイルなし)`); continue; }
  await page.setContent(
    `<body style="margin:0;background:#fff"><img id="t" src="file://${file}" style="display:block;width:${width}px;height:auto"></body>`,
  );
  await page.waitForFunction(() => {
    const el = document.getElementById("t");
    return el && el.complete && el.naturalWidth > 0;
  }, { timeout: 30000 }).catch(() => console.log(`  ${name}: 読み込み待ちタイムアウト`));
  await page.locator("#t").screenshot({ path: `${SP}/thumbs/${name}.png` });
  const kb = (fs.statSync(`${SP}/thumbs/${name}.png`).size / 1024).toFixed(0);
  console.log(`OK ${name} (${kb}KB)`);
}
await browser.close();
