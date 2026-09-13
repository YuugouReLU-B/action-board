"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setUserAdminRole } from "@/features/admin/actions/user-actions";

type AdminRoleToggleButtonProps = {
  userId: string;
  userLabel: string;
  isAdmin: boolean;
  /** 自分自身は降格できないのでボタンを出さない */
  isSelf: boolean;
};

export function AdminRoleToggleButton({
  userId,
  userLabel,
  isAdmin,
  isSelf,
}: AdminRoleToggleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return <span className="text-xs text-gray-500">本人</span>;
  }

  const handleClick = () => {
    const message = isAdmin
      ? `「${userLabel}」から管理者権限を外します。よろしいですか？`
      : `「${userLabel}」に管理者権限を与えます。管理画面のすべての操作ができるようになります。よろしいですか？`;
    if (!window.confirm(message)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setUserAdminRole(userId, !isAdmin);
      if (!result.success) {
        setError(result.error);
        return;
      }
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
        className={
          isAdmin ? "border-red-300 text-red-700 hover:bg-red-50" : undefined
        }
      >
        {isPending ? "変更中..." : isAdmin ? "管理者から外す" : "管理者にする"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
