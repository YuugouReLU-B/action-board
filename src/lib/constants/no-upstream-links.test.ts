import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * 派生元（チームみらい）のサイトへ利用者を送るリンクが混ざっていないかを見張る。
 *
 * 画面の文言を「チームみらい」で検索しても、リンクの**行き先**だけが
 * 残っているケースは見つからない。実際にフッターの「よくあるご質問」が
 * team-mirai.notion.site を指したまま本番に出ていた。
 *
 * 判定するのは外部リンクの宛先だけ。移植元から引き継いだ画像ファイル名
 * （`..._TeamMirai-logo.svg` など）は差し替え待ちの素材なので対象にしない。
 */
const UPSTREAM_HOST_PATTERN = String.raw`https?://[a-zA-Z0-9.-]*(team-mirai|teammirai)[a-zA-Z0-9.-]*`;

const SRC_DIR = path.join(process.cwd(), "src");

function findUpstreamLinks(): string[] {
  try {
    const output = execFileSync(
      "grep",
      [
        "-rEn",
        "--include=*.ts",
        "--include=*.tsx",
        UPSTREAM_HOST_PATTERN,
        SRC_DIR,
      ],
      { encoding: "utf8" },
    );
    return (
      output
        .split("\n")
        .filter((line) => line.trim() !== "")
        // このテスト自身はパターンを書いているので除く
        .filter((line) => !line.includes("no-upstream-links.test.ts"))
    );
  } catch (error) {
    // grep は一致が無いと終了コード1を返す。それが期待する状態
    const status = (error as { status?: number }).status;
    if (status === 1) return [];
    throw error;
  }
}

describe("派生元サイトへのリンク", () => {
  it("src の中に残っていない", () => {
    expect(findUpstreamLinks()).toEqual([]);
  });
});
