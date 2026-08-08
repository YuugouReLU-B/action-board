import fs from "node:fs";
import path from "node:path";
import {
  APP_COLOR_TOKEN_GROUPS,
  APP_COLOR_TOKENS,
  getTokenDefault,
  listTailwindPaletteVars,
  readTokenColor,
  SEMANTIC_TOKEN_GROUP,
} from "./color-tokens";

const globalsCss = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
);

/** globals.css の :root ブロックから `--name: value;` を抜き出す */
function parseRootVariables(css: string): Map<string, string> {
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\s{2}\}/);
  if (!rootBlock) {
    throw new Error("globals.css の :root ブロックが見つかりません");
  }

  const variables = new Map<string, string>();
  const pattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match = pattern.exec(rootBlock[1]);
  while (match !== null) {
    variables.set(match[1], match[2].trim());
    match = pattern.exec(rootBlock[1]);
  }
  return variables;
}

const rootVariables = parseRootVariables(globalsCss);

describe("カラートークンカタログ", () => {
  it("globals.css の :root から変数を読み取れる", () => {
    expect(rootVariables.size).toBeGreaterThan(50);
  });

  describe.each([...APP_COLOR_TOKEN_GROUPS, SEMANTIC_TOKEN_GROUP])("$label", ({
    tokens,
  }) => {
    it.each(
      tokens,
    )("$cssVar が globals.css に $defaultValue で定義されている", ({
      cssVar,
      defaultValue,
    }) => {
      expect(rootVariables.get(cssVar)).toBe(defaultValue);
    });
  });

  it("globals.css の --app-* が全てカタログに載っている", () => {
    const declared = Array.from(rootVariables.keys()).filter((name) =>
      name.startsWith("--app-"),
    );
    const cataloged = new Set(APP_COLOR_TOKENS.map((token) => token.cssVar));

    expect(declared.filter((name) => !cataloged.has(name))).toEqual([]);
  });

  it("変数名が重複していない", () => {
    const names = [...APP_COLOR_TOKENS, ...SEMANTIC_TOKEN_GROUP.tokens].map(
      (token) => token.cssVar,
    );

    expect(names).toHaveLength(new Set(names).size);
  });

  it("hex 形式のトークンは小文字6桁で書かれている", () => {
    const invalid = APP_COLOR_TOKENS.filter(
      (token) =>
        token.format === "hex" && !/^#[0-9a-f]{6}$/.test(token.defaultValue),
    );

    expect(invalid).toEqual([]);
  });

  it("hsl-triplet 形式のトークンは `H S% L%` で書かれている", () => {
    const invalid = SEMANTIC_TOKEN_GROUP.tokens.filter(
      (token) =>
        token.format === "hsl-triplet" &&
        !/^\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%$/.test(token.defaultValue),
    );

    expect(invalid).toEqual([]);
  });

  it("外部サービスのブランド色は全てロックされている", () => {
    const vendor = APP_COLOR_TOKEN_GROUPS.find(
      (group) => group.id === "vendor",
    );

    expect(vendor?.tokens.every((token) => token.locked)).toBe(true);
  });
});

describe("listTailwindPaletteVars", () => {
  it("--color-{name}-{shade} 形式で列挙する", () => {
    const vars = listTailwindPaletteVars();

    expect(vars).toContain("--color-gray-500");
    expect(vars).toContain("--color-emerald-100");
    expect(vars.every((name) => /^--color-[a-z]+-\d+$/.test(name))).toBe(true);
  });
});

describe("getTokenDefault", () => {
  it("アプリ固有トークンの既定値を返す", () => {
    expect(getTokenDefault("--app-brand-primary")).toBe("#30baa7");
  });

  it("セマンティックトークンの既定値を返す", () => {
    expect(getTokenDefault("--primary")).toBe("168 59% 41%");
  });

  it("未知の変数には undefined を返す", () => {
    expect(getTokenDefault("--app-does-not-exist")).toBeUndefined();
  });
});

describe("readTokenColor", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--app-brand-primary");
  });

  it("CSS 変数が未設定ならカタログの既定値を返す", () => {
    expect(readTokenColor("--app-brand-primary")).toBe("#30baa7");
  });

  it("CSS 変数が設定されていればその値を返す", () => {
    document.documentElement.style.setProperty(
      "--app-brand-primary",
      "#ff0000",
    );

    expect(readTokenColor("--app-brand-primary")).toBe("#ff0000");
  });

  it("カタログにない変数は fallback を返す", () => {
    expect(readTokenColor("--app-unknown", "#123456")).toBe("#123456");
  });
});
