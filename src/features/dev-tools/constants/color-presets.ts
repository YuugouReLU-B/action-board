import {
  APP_COLOR_TOKEN_GROUPS,
  SEMANTIC_TOKEN_GROUP,
} from "@/lib/design/color-tokens";
import { hslTripletToHex } from "../utils/color-format";

/**
 * `/dev` のデザイン差し替えで一括適用するカラープリセット。
 *
 * 値は全て hex で持ち、適用時にトークンの format（hex / hsl-triplet）へ
 * 変換する。手で HSL を計算しないことで定義ミスを避ける。
 *
 * ## 対象範囲
 * ブランド色とセマンティックトークンだけを差し替える。
 * 地図のステータス色・戸別ポスター密度・都道府県ランキング配色は
 * 「色そのものが意味を持つ」ため、プリセットでは触らない。
 * 外部サービスのブランド色も同様に対象外（そもそもロックされている）。
 */

export interface ColorPreset {
  id: string;
  label: string;
  description: string;
  /** 出典サイト */
  source?: { label: string; url: string };
  /** UI に並べる代表色（左から順に表示） */
  swatches: string[];
  /** CSS 変数名 -> hex 値 */
  values: Record<string, string>;
  /**
   * WCAG AA（4.5:1）を満たさないと分かっている組み合わせ。
   * テストはここに載っているペアだけ基準を緩め、記録値より悪化したら失敗する。
   * 新しく作るプリセットでは空にすること。
   */
  knownContrastIssues?: Array<{ pair: string; ratio: number; reason: string }>;
}

/** プリセットが触ってよいトークンかどうか */
const PRESET_TARGET_GROUP_IDS = new Set(["brand", "onboarding"]);

/**
 * セマンティックトークンのうちプリセットで扱わないもの。
 * 破壊的操作の赤とグラフの系列色は、色自体が意味を持つため据え置く。
 */
const SEMANTIC_PRESET_EXCLUDED = new Set([
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
]);

/**
 * カタログの既定値から「元の配色」プリセットを組み立てる。
 * ハードコードせず生成することで globals.css との乖離を防ぐ。
 */
function buildDefaultPreset(): ColorPreset {
  const values: Record<string, string> = {};

  for (const group of APP_COLOR_TOKEN_GROUPS) {
    if (!PRESET_TARGET_GROUP_IDS.has(group.id)) continue;
    for (const token of group.tokens) {
      values[token.cssVar] = token.defaultValue;
    }
  }

  // セマンティックトークンの既定値は hsl-triplet。
  // ここで hex に直して持つことで、globals.css を唯一の定義元に保つ。
  for (const token of SEMANTIC_TOKEN_GROUP.tokens) {
    if (SEMANTIC_PRESET_EXCLUDED.has(token.cssVar)) continue;

    const hex = hslTripletToHex(token.defaultValue);
    if (hex) values[token.cssVar] = hex;
  }

  return {
    id: "default",
    label: "既定（浜通りクエスト）",
    description:
      "派生元から引き継いだティール系の配色。globals.css に書かれている値そのもの。",
    swatches: ["#30baa7", "#64d8c6", "#bcecd3", "#f5f1ea", "#ffffff"],
    values,
    knownContrastIssues: [
      {
        pair: "プライマリ前景 / プライマリ",
        ratio: 2.89,
        reason:
          "ティールのボタン上のほぼ白い文字。派生元から引き継いだ状態で AA 未達。修正すると全ボタンの文字色が変わるため据え置いている。",
      },
      {
        pair: "ミュート前景 / ミュート",
        ratio: 4.34,
        reason:
          "補足テキスト。AA まで 0.16 足りない。派生元から引き継いだ状態。",
      },
      {
        pair: "ミュート前景 / 背景",
        ratio: 4.28,
        reason:
          "ページ背景に直接載る補足テキスト（区切り線の「または」やフッターの著作権表示）。派生元から引き継いだ状態。",
      },
    ],
  };
}

/**
 * 浜通りサークルの配色。
 *
 * 実サイトを描画して計測した値をもとにしている:
 * body 背景 #ffea00 / カード #ffffff / 本文 #231815 / 補足 #777777 /
 * 淡い黄 #fff8a3 / 微背景 #f9f9f9
 *
 * そのままでは破綻する点を2つ調整している。
 * 1. 既定の `--primary-foreground`（ほぼ白）を黄色に載せると 1.18:1 で
 *    判読できないため #231815（14.03:1）に置き換える
 * 2. 実サイトの補足色 #777777 は AA 未達のため #666666 へ寄せる。
 *    補足テキストは黄色の背景に直接載る箇所（区切り線の「または」や
 *    フッターの著作権表示）があり、そこが最も条件が厳しい
 *    （#777777 は黄背景で 3.63:1、#666666 なら 4.65:1）
 * また白背景で見えない純黄色は、トップローダー・カレンダー・リンクなど
 * 「白の上に置く」用途に限って濃い金色へ落としている。
 */
const HAMADOORI_CIRCLE_PRESET: ColorPreset = {
  id: "hamadoori-circle",
  label: "浜通りサークル",
  description:
    "黄色（#ffea00）と白を基調にした配色。本文は暖かみのある黒 #231815。白地に置く要素は視認性のため濃い金色に落としている。",
  source: {
    label: "hamadoori-circle.com",
    url: "https://hamadoori-circle.com/",
  },
  swatches: ["#ffea00", "#fff8a3", "#ffffff", "#231815", "#666666"],
  values: {
    // --- ブランド ---
    "--app-brand-primary": "#ffea00",
    // 白背景のトップローダー。純黄色だと 1.23:1 で見えないため濃い金に
    "--app-brand-primary-strong": "#b38f00",
    // カレンダーのアクセントと OG 画像の見出し。白地に文字として載る
    "--app-brand-deep": "#8a7300",
    "--app-brand-link-hover": "#6b5900",
    "--app-brand-light": "#ffea00",
    "--app-brand-pale": "#fff8a3",
    "--app-brand-level-end": "#ffd400",
    "--app-brand-surface": "#fff8a3",

    // --- オンボーディング ---
    "--app-onboarding-from": "#ffea00",
    "--app-onboarding-to": "#fff8a3",

    // --- セマンティック ---
    "--background": "#ffea00",
    "--foreground": "#231815",
    "--card": "#ffffff",
    "--card-foreground": "#231815",
    "--popover": "#ffffff",
    "--popover-foreground": "#231815",
    "--primary": "#ffea00",
    "--primary-foreground": "#231815",
    "--secondary": "#f9f9f9",
    "--secondary-foreground": "#231815",
    "--muted": "#f9f9f9",
    "--muted-foreground": "#666666",
    "--accent": "#fff8a3",
    "--accent-foreground": "#231815",
    "--ring": "#231815",
  },
};

export const COLOR_PRESETS: ColorPreset[] = [
  buildDefaultPreset(),
  HAMADOORI_CIRCLE_PRESET,
];

/**
 * 可読性を検証すべき「前景 / 背景」の組み合わせ。
 * テストがこの全ペアで WCAG AA（4.5:1）を満たすか確認する。
 */
export const CONTRAST_PAIRS: Array<{
  label: string;
  foreground: string;
  background: string;
}> = [
  {
    label: "本文 / 背景",
    foreground: "--foreground",
    background: "--background",
  },
  {
    label: "カード本文 / カード",
    foreground: "--card-foreground",
    background: "--card",
  },
  {
    label: "ポップオーバー本文 / ポップオーバー",
    foreground: "--popover-foreground",
    background: "--popover",
  },
  {
    label: "プライマリ前景 / プライマリ",
    foreground: "--primary-foreground",
    background: "--primary",
  },
  {
    label: "セカンダリ前景 / セカンダリ",
    foreground: "--secondary-foreground",
    background: "--secondary",
  },
  {
    label: "ミュート前景 / ミュート",
    foreground: "--muted-foreground",
    background: "--muted",
  },
  {
    label: "アクセント前景 / アクセント",
    foreground: "--accent-foreground",
    background: "--accent",
  },
  // 補足テキストは薄いミュート面だけでなくページ背景に直接載る箇所がある
  // （区切り線の「または」やフッターの著作権表示など）
  {
    label: "ミュート前景 / 背景",
    foreground: "--muted-foreground",
    background: "--background",
  },
  {
    label: "ミュート前景 / カード",
    foreground: "--muted-foreground",
    background: "--card",
  },
];

/** プリセットが指定しうる全 CSS 変数（カタログ側の存在確認に使う） */
export function listPresetTargetVars(): string[] {
  const appVars = APP_COLOR_TOKEN_GROUPS.filter((group) =>
    PRESET_TARGET_GROUP_IDS.has(group.id),
  ).flatMap((group) => group.tokens.map((token) => token.cssVar));

  const semanticVars = SEMANTIC_TOKEN_GROUP.tokens
    .map((token) => token.cssVar)
    .filter((cssVar) => !SEMANTIC_PRESET_EXCLUDED.has(cssVar));

  return [...appVars, ...semanticVars];
}
