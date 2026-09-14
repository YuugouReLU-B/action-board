"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { buildLineLoginHref } from "@/features/auth/client/line-auth";
import { cn } from "@/lib/utils/utils";

interface SignInFormProps {
  returnUrl?: string;
}

export default function SignInForm({ returnUrl }: SignInFormProps) {
  const [isLineLoading, setIsLineLoading] = useState(false);

  return (
    <div className="flex flex-col gap-4 mt-8 min-w-72 max-w-72 mx-auto">
      {/* LINEログインボタン。
          クリックからそのまま遷移する素のリンクにしているのは、
          途中でサーバーアクションをawaitすると（=ユーザー操作から
          非同期の間隙ができると）iOS Safariがアプリ起動判定をしなくなり、
          LINEアプリが入っていてもWebのログイン画面になってしまうため */}
      <a
        href={buildLineLoginHref(returnUrl)}
        onClick={() => setIsLineLoading(true)}
        className={cn(
          buttonVariants(),
          "w-full h-12 bg-[var(--app-vendor-line-green)] hover:bg-[var(--app-vendor-line-green-hover)] text-white",
          isLineLoading && "pointer-events-none opacity-50",
        )}
      >
        {isLineLoading ? "LINE連携中..." : "LINEでログイン"}
      </a>
    </div>
  );
}
