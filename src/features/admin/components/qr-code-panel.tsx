"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { issueMissionQrCode } from "@/features/admin/actions/mission-actions";

type QrCodePanelProps = {
  missionId: string;
  missionTitle: string;
  /** 未発行なら null */
  qrUrl: string | null;
};

/**
 * QRスポットのコード発行と印刷用の表示。
 *
 * コード自体が認証材料なので、この画面（管理者のみ）以外には出さない。
 */
export function QrCodePanel({
  missionId,
  missionTitle,
  qrUrl,
}: QrCodePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingReissue, setConfirmingReissue] = useState(false);

  const issue = () => {
    setError(null);
    startTransition(async () => {
      const result = await issueMissionQrCode(missionId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setConfirmingReissue(false);
      router.refresh();
    });
  };

  if (!qrUrl) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="mb-3 text-sm text-gray-600">
          QRコードはまだ発行されていません。発行するとスポットで読み取れるようになります。
        </p>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <Button type="button" onClick={issue} disabled={isPending}>
          {isPending ? "発行中..." : "QRコードを発行する"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-start gap-6">
        <div className="rounded-lg bg-white p-3">
          <QRCode value={qrUrl} size={180} />
        </div>

        <div className="min-w-[240px] flex-1 space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-600">読み取り先</p>
            <code className="block break-all text-xs text-gray-600">
              {qrUrl}
            </code>
          </div>

          <p className="text-xs text-gray-500">
            このURLを知っていれば現地に行かなくても獲得できます。
            <strong>印刷物以外に出さないでください。</strong>
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {confirmingReissue ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-sm text-amber-900">
                作り直すと<strong>印刷済みのQRは読めなくなります。</strong>「
                {missionTitle}」のQRを貼り替える必要があります。
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={issue}
                  disabled={isPending}
                >
                  {isPending ? "発行中..." : "それでも作り直す"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmingReissue(false)}
                  disabled={isPending}
                >
                  やめる
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirmingReissue(true)}
            >
              コードを作り直す
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
