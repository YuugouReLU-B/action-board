"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * ログイン後のホームで、参加方法の案内図をモーダルで見られるようにするリンク。
 * 大きな案内図を常時表示する代わりに、必要なときだけ開く。
 */
export function HowToPlayModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm font-bold text-gray-700 underline underline-offset-2 hover:text-gray-900"
        >
          遊び方
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogTitle className="text-center text-xl font-extrabold">
          参加方法
        </DialogTitle>
        <Image
          src="/img/how-to-participate-mobile.png"
          alt="参加方法：1. 浜通りクエストを開く 2. イベント参加・プレイヤー訪問 3. その場でポイント獲得 4. 1000ポイントで景品応募"
          width={1135}
          height={1243}
          className="w-full h-auto rounded-lg md:hidden"
        />
        <Image
          src="/img/how-to-participate.png"
          alt="参加方法：1. 浜通りクエストを開く 2. イベント参加・プレイヤー訪問 3. その場でポイント獲得 4. 1000ポイントで景品応募"
          width={1672}
          height={693}
          className="hidden md:block w-full h-auto rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}
