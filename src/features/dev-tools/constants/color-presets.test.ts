import {
  APP_COLOR_TOKENS,
  SEMANTIC_TOKEN_GROUP,
} from "@/lib/design/color-tokens";
import { contrastRatio } from "../utils/color-format";
import {
  COLOR_PRESETS,
  CONTRAST_PAIRS,
  listPresetTargetVars,
} from "./color-presets";

/** WCAG AA の本文テキスト基準 */
const AA_TEXT = 4.5;

const catalogVars = new Set([
  ...APP_COLOR_TOKENS.map((token) => token.cssVar),
  ...SEMANTIC_TOKEN_GROUP.tokens.map((token) => token.cssVar),
]);

describe("カラープリセット", () => {
  it("プリセットが3件ある", () => {
    expect(COLOR_PRESETS.map((preset) => preset.id)).toEqual([
      "default",
      "hamadoori-circle",
      "hamadoori-circle-white",
    ]);
  });

  it("id が重複していない", () => {
    const ids = COLOR_PRESETS.map((preset) => preset.id);
    expect(ids).toHaveLength(new Set(ids).size);
  });

  describe.each(COLOR_PRESETS)("$label", (preset) => {
    it("値が全て小文字6桁の hex", () => {
      const invalid = Object.entries(preset.values).filter(
        ([, value]) => !/^#[0-9a-f]{6}$/.test(value),
      );

      expect(invalid).toEqual([]);
    });

    it("指定する変数が全てカタログに存在する", () => {
      const unknown = Object.keys(preset.values).filter(
        (cssVar) => !catalogVars.has(cssVar),
      );

      expect(unknown).toEqual([]);
    });

    it("プリセット対象の変数を漏れなく指定している", () => {
      const missing = listPresetTargetVars().filter(
        (cssVar) => !(cssVar in preset.values),
      );

      expect(missing).toEqual([]);
    });

    it("意味を持つ色（地図ステータス・ランキング配色・破壊的操作）に触れていない", () => {
      const forbidden = Object.keys(preset.values).filter(
        (cssVar) =>
          cssVar.startsWith("--app-poster-") ||
          cssVar.startsWith("--app-posting-") ||
          cssVar.startsWith("--app-density-") ||
          cssVar.startsWith("--app-rank-") ||
          cssVar.startsWith("--app-vendor-") ||
          cssVar.startsWith("--destructive") ||
          cssVar.startsWith("--chart-"),
      );

      expect(forbidden).toEqual([]);
    });

    it("スワッチが1つ以上あり全て hex", () => {
      expect(preset.swatches.length).toBeGreaterThan(0);
      for (const swatch of preset.swatches) {
        expect(swatch).toMatch(/^#[0-9a-f]{6}$/);
      }
    });

    it.each(CONTRAST_PAIRS)("$label のコントラスト", ({
      label,
      foreground,
      background,
    }) => {
      const fg = preset.values[foreground];
      const bg = preset.values[background];
      expect(fg).toBeDefined();
      expect(bg).toBeDefined();

      const ratio = contrastRatio(fg, bg);
      expect(ratio).not.toBeNull();

      const known = preset.knownContrastIssues?.find(
        (issue) => issue.pair === label,
      );

      // 既知の未達ペアは「悪化していないこと」だけを担保する
      const floor = known ? known.ratio : AA_TEXT;
      expect(ratio as number).toBeGreaterThanOrEqual(floor);
    });

    it("既知の未達ペアが実際にまだ AA 未達である（解消したら記録を消す）", () => {
      for (const issue of preset.knownContrastIssues ?? []) {
        const pair = CONTRAST_PAIRS.find((item) => item.label === issue.pair);
        expect(pair).toBeDefined();

        const ratio = contrastRatio(
          preset.values[(pair as (typeof CONTRAST_PAIRS)[number]).foreground],
          preset.values[(pair as (typeof CONTRAST_PAIRS)[number]).background],
        ) as number;

        expect(ratio).toBeLessThan(AA_TEXT);
      }
    });
  });

  it("新規プリセット（既定以外）に既知の未達ペアがない", () => {
    const offenders = COLOR_PRESETS.filter(
      (preset) =>
        preset.id !== "default" &&
        (preset.knownContrastIssues?.length ?? 0) > 0,
    );

    expect(offenders.map((preset) => preset.id)).toEqual([]);
  });
});

describe("浜通りサークルのプリセット固有の検証", () => {
  const preset = COLOR_PRESETS.find(
    (item) => item.id === "hamadoori-circle",
  ) as (typeof COLOR_PRESETS)[number];

  it("実サイトの基調色を使っている", () => {
    expect(preset.values["--app-brand-primary"]).toBe("#ffea00");
    expect(preset.values["--card"]).toBe("#ffffff");
    expect(preset.values["--foreground"]).toBe("#231815");
  });

  it("黄色の上の文字が既定のほぼ白のままになっていない", () => {
    // 既定の --primary-foreground(#fafafa) を黄色に載せると 1.18:1 で読めない
    const naive = contrastRatio("#fafafa", "#ffea00") as number;
    expect(naive).toBeLessThan(2);

    const actual = contrastRatio(
      preset.values["--primary-foreground"],
      preset.values["--primary"],
    ) as number;
    expect(actual).toBeGreaterThan(10);
  });

  it("白背景に置く要素は UI 部品の基準 (3:1) を満たす", () => {
    for (const cssVar of [
      "--app-brand-primary-strong",
      "--app-brand-deep",
      "--app-brand-link-hover",
    ]) {
      const ratio = contrastRatio(preset.values[cssVar], "#ffffff") as number;
      expect(ratio).toBeGreaterThanOrEqual(3);
    }
  });

  it("リンクホバー色は本文として読める (4.5:1)", () => {
    const ratio = contrastRatio(
      preset.values["--app-brand-link-hover"],
      "#ffffff",
    ) as number;
    expect(ratio).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe("既定プリセット", () => {
  const preset = COLOR_PRESETS.find(
    (item) => item.id === "default",
  ) as (typeof COLOR_PRESETS)[number];

  it("カタログの既定値から生成されている", () => {
    // globals.css を変えたらこの期待値も自動で追従する
    const brandPrimary = APP_COLOR_TOKENS.find(
      (token) => token.cssVar === "--app-brand-primary",
    );

    expect(preset.values["--app-brand-primary"]).toBe(
      brandPrimary?.defaultValue,
    );
  });
});
