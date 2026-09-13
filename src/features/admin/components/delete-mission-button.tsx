"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteMission } from "@/features/admin/actions/mission-actions";

type DeleteMissionButtonProps = {
  missionId: string;
  missionTitle: string;
  /** 達成した人が1人でもいると外部キー制約で削除できないため、事前にボタンを無効化する */
  achievementCount: number;
};

export function DeleteMissionButton({
  missionId,
  missionTitle,
  achievementCount,
}: DeleteMissionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (achievementCount > 0) {
    return (
      <p className="text-sm text-gray-500">
        すでに達成した人がいるため削除できません。一覧から消したいだけなら下の「公開する」のチェックを外してください
      </p>
    );
  }

  const handleClick = () => {
    if (
      !window.confirm(
        `「${missionTitle}」を削除します。この操作は元に戻せません。よろしいですか？`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteMission(missionId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/admin/missions");
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
        className="border-red-300 text-red-700 hover:bg-red-50"
      >
        {isPending ? "削除中..." : "このクエストを削除する"}
      </Button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
