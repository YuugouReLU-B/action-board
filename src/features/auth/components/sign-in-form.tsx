"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithLine } from "@/features/auth/client/line-auth";

interface SignInFormProps {
  returnUrl?: string;
}

export default function SignInForm({ returnUrl }: SignInFormProps) {
  const [isLineLoading, setIsLineLoading] = useState(false);

  const handleLINELogin = async () => {
    try {
      setIsLineLoading(true);
      await signInWithLine(returnUrl);
    } catch (_error) {
      setIsLineLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-8 min-w-72 max-w-72 mx-auto">
      {/* LINEログインボタン */}
      <Button
        type="button"
        onClick={handleLINELogin}
        disabled={isLineLoading}
        className="w-full h-12 bg-[var(--app-vendor-line-green)] hover:bg-[var(--app-vendor-line-green-hover)] text-white"
      >
        {isLineLoading ? "LINE連携中..." : "LINEでログイン"}
      </Button>
    </div>
  );
}
