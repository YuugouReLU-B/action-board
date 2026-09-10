"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithLine } from "@/features/auth/client/line-auth";

interface LineFriendFormProps {
  /** 友だち追加URL。未設定なら追加ボタンを出さない */
  addFriendUrl?: string;
  /** 確認後に戻ってくるパス */
  returnUrl?: string;
}

/**
 * 公式LINE友だち追加ミッションのフォーム。
 *
 * 提出物は無い。友だちかどうかは LINE の friendFlag で判定するため、
 * 「追加を確認する」でLINE認証を1往復させて最新の状態を取り直す。
 * 同意済みなら操作なしで戻ってくる。友だちなら
 * コールバック側でミッションが自動達成される。
 */
export function LineFriendForm({
  addFriendUrl,
  returnUrl,
}: LineFriendFormProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    try {
      setIsChecking(true);
      setError(null);
      await signInWithLine(returnUrl);
    } catch (_error) {
      setIsChecking(false);
      setError("確認に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        公式LINEを友だち追加すると達成になります。追加したあとに「追加を確認する」を押してください。
      </p>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {addFriendUrl && (
        <Button
          asChild
          className="h-12 w-full bg-[var(--app-vendor-line-green)] text-white hover:bg-[var(--app-vendor-line-green-hover)]"
        >
          <a href={addFriendUrl} target="_blank" rel="noopener noreferrer">
            公式LINEを友だち追加する
          </a>
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full"
        onClick={handleVerify}
        disabled={isChecking}
      >
        {isChecking ? "確認中..." : "追加を確認する"}
      </Button>
    </div>
  );
}
