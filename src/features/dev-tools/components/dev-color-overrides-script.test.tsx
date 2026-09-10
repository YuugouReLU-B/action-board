import { render } from "@testing-library/react";
import { DEV_COLOR_OVERRIDES_STORAGE_KEY } from "../constants/storage";
import { DevColorOverridesScript } from "./dev-color-overrides-script";

/** NODE_ENV は読み取り専用なので定義し直して差し替える */
function setNodeEnv(value: string) {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
  });
}

describe("DevColorOverridesScript", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    setNodeEnv(originalNodeEnv as string);
  });

  it("本番では何も出力しない", () => {
    setNodeEnv("production");

    const { container } = render(<DevColorOverridesScript />);

    expect(container.querySelector("script")).toBeNull();
  });

  it("開発ではスクリプトを出力する", () => {
    setNodeEnv("development");

    const { container } = render(<DevColorOverridesScript />);
    const script = container.querySelector("script");

    expect(script).not.toBeNull();
    expect(script?.innerHTML).toContain(DEV_COLOR_OVERRIDES_STORAGE_KEY);
  });

  it("CSS 変数以外のキーは適用しない", () => {
    setNodeEnv("development");

    const { container } = render(<DevColorOverridesScript />);
    const script = container.querySelector("script")?.innerHTML ?? "";

    // `--` で始まるキーだけを setProperty する実装であること
    expect(script).toContain('name.slice(0, 2) === "--"');
  });

  it("出力したスクリプトが localStorage の上書きを適用する", () => {
    setNodeEnv("development");
    localStorage.setItem(
      DEV_COLOR_OVERRIDES_STORAGE_KEY,
      JSON.stringify({
        "--app-brand-primary": "#ff0000",
        "not-a-css-var": "#00ff00",
      }),
    );

    const { container } = render(<DevColorOverridesScript />);
    const source = container.querySelector("script")?.innerHTML ?? "";
    // biome-ignore lint/security/noGlobalEval: 出力されたスクリプトの挙動を検証するため
    eval(source);

    const style = document.documentElement.style;
    expect(style.getPropertyValue("--app-brand-primary")).toBe("#ff0000");
    expect(style.getPropertyValue("not-a-css-var")).toBe("");

    style.removeProperty("--app-brand-primary");
    localStorage.removeItem(DEV_COLOR_OVERRIDES_STORAGE_KEY);
  });
});
