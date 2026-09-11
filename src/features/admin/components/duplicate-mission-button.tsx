"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { duplicateMission } from "@/features/admin/actions/mission-actions";

/**
 * ミッションを複製する。イベントごとにQRチェックインを増やす用途を想定している。
 * 複製先は非公開で作られ、QRコードは引き継がない。
 */
export function DuplicateMissionButton({ missionId }: { missionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await duplicateMission(missionId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/admin/missions/${result.missionId}`);
      router.refresh();
    });
  };

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "複製中..." : "このミッションを複製する"}
      </Button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
