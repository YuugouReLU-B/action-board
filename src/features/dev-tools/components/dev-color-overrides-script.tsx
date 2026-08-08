import { DEV_COLOR_OVERRIDES_STORAGE_KEY } from "../constants/storage";

/**
 * `/dev` のデザイン差し替えで上書きした色を、アプリ全体に適用するブートストラップ。
 *
 * 上書きは localStorage にしかないため、`/dev/design` を離れると効かなくなる。
 * それではプレビューにならないので、全ページのハイドレーション前に
 * インラインスクリプトで `<html>` の style へ流し込む。
 *
 * - React が管理しない inline style を触るだけなので hydration mismatch は起きない
 * - 描画前に走るため色のちらつきがない
 * - 本番ビルドでは何も出力しない
 */
export function DevColorOverridesScript() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const script = `
try {
  var raw = localStorage.getItem(${JSON.stringify(DEV_COLOR_OVERRIDES_STORAGE_KEY)});
  if (raw) {
    var overrides = JSON.parse(raw);
    for (var name in overrides) {
      if (name.slice(0, 2) === "--" && typeof overrides[name] === "string") {
        document.documentElement.style.setProperty(name, overrides[name]);
      }
    }
  }
} catch (error) {
  console.warn("[dev] カラー上書きの適用に失敗しました", error);
}
`.trim();

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: 開発時のみ出力する固定スクリプト
    <script dangerouslySetInnerHTML={{ __html: script }} />
  );
}
