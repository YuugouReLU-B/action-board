import { ColorSwatchEditor } from "@/features/dev-tools/components/color-swatch-editor";

export default function DevDesignPage() {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold">デザインの差し替え</h2>

      <div className="mb-4 space-y-1 text-sm text-gray-600">
        <p>
          プロジェクトで使われている色は全て CSS 変数として{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5">
            src/app/globals.css
          </code>{" "}
          に定義されています。ここで変更すると、その変数を参照している箇所が一斉に切り替わります。
        </p>
        <p>
          反映されない箇所が2つあります。canvas
          で描画される演出（花火・冬季エフェクト）と地図のマーカー・ポリゴンは、
          JavaScript が変数を読んだ時点の値を使うため
          <strong className="font-bold">リロード後に反映</strong>
          されます。OG画像はサーバー側で生成されるため反映されません。
        </p>
      </div>

      <ColorSwatchEditor />
    </section>
  );
}
