"use client";

import { Button } from "@/components/ui/button";

/** 印刷ダイアログを開くだけのボタン。印刷結果には出さない */
export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="print:hidden"
    >
      印刷する
    </Button>
  );
}
