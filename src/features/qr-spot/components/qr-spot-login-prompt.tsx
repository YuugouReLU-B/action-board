"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithLine } from "@/features/auth/client/line-auth";

type QrSpotLoginPromptProps = {
  /** ログイン後に戻ってくるパス（`/q/<code>`） */
  returnUrl: string;
};

/**
 * 未ログインでQRを読んだときの案内。
 *
 * 自動でLINEに飛ばさないのは、本人の意図しないアカウント作成になるため。
 * 何が起きるかを見せてからボタンを押してもらう。
 */
export function QrSpotLoginPrompt({ returnUrl }: QrSpotLoginPromptProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setIsRedirecting(true);
      setError(null);
      await signInWithLine(returnUrl);
    } catch (_error) {
      setIsRedirecting(false);
      setError("ログインに失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ポイントを受け取るには浜通りクエストへの登録が必要です。
        LINEでログインすると、このスポットのポイントがそのまま入ります。
      </p>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleLogin}
        disabled={isRedirecting}
        className="w-full"
        size="lg"
      >
        {isRedirecting ? "LINEへ移動しています..." : "LINEではじめる"}
      </Button>
    </div>
  );
}
