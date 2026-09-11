"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustUserPoints } from "@/features/admin/actions/points-actions";

export function PointsAdjustForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount === 0) {
      setMessage({ tone: "error", text: "0以外の整数を入力してください" });
      return;
    }

    startTransition(async () => {
      const result = await adjustUserPoints(userId, parsedAmount, reason);
      if (!result.success) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setMessage({ tone: "success", text: "反映しました" });
      setAmount("");
      setReason("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="±pt"
        className="w-24"
        aria-label="増減するポイント"
      />
      <Input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="メモ（任意）"
        className="w-40"
        aria-label="調整理由"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "反映中..." : "適用"}
      </Button>
      {message && (
        <span
          className={`text-sm ${message.tone === "success" ? "text-green-700" : "text-red-600"}`}
        >
          {message.text}
        </span>
      )}
    </form>
  );
}
