"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { verifyLineFriendship } from "@/features/auth/actions/verify-line-friendship";

interface LineFriendFormProps {
  /** 友だち追加URL。未設定なら追加ボタンを出さない */
  addFriendUrl?: string;
  onSuccess?: () => void;
}

/**
 * 公式LINE友だち追加ミッションのフォーム。
 *
 * 提出物は無い。友だちかどうかは LINE の Messaging API
 * （チャネルアクセストークンのみで呼べる、ユーザー側の操作は不要）で判定する。
 * ログイン済みなのに「追加を確認する」でLINEログインをやり直させるのは
 * UXが悪いため、この方式に切り替えている。
 */
export function LineFriendForm({
  addFriendUrl,
  onSuccess,
}: LineFriendFormProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const result = await verifyLineFriendship();
      switch (result.status) {
        case "granted":
          onSuccess?.();
          router.refresh();
          return;
        case "not_friend":
          setError(
            "まだ友だち追加が確認できませんでした。追加後にもう一度お試しください。",
          );
          return;
        case "unauthenticated":
          setError("ログインし直してからもう一度お試しください。");
          return;
        default:
          setError(
            "確認に失敗しました。しばらくしてからもう一度お試しください。",
          );
      }
    } catch {
      setError("確認に失敗しました。もう一度お試しください。");
    } finally {
      setIsChecking(false);
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
