"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  token: string;
};

export function CopyTokenButton({ token }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button onClick={handleCopy} className="mt-2" variant="outline">
      {copied ? "コピーしました！" : "トークンをコピー"}
    </Button>
  );
}
