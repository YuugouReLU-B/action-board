import { Menu } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUser } from "@/features/user-profile/services/profile";

export default async function AuthButton() {
  const user = await getUser();

  return user /* && profile */ ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="ユーザーメニューを開く"
          data-testid="usermenubutton"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/">ホーム</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/users/${user.id}`}>マイページ</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings/profile">アカウント</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          {/*
            asChild でボタン自体をメニュー項目にする。ボタンを項目の「中」に
            置くと、キーボードのEnterはRadixが項目側で処理してしまい、
            送信ボタンまで届かずログアウトできない
          */}
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="w-full text-left cursor-default"
              data-testid="sign-out"
            >
              ログアウト
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/sign-in">ログイン</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/sign-up">新規登録</Link>
      </Button>
    </div>
  );
}
