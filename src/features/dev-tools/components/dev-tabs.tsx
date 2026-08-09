"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dev", label: "ページ一覧" },
  { href: "/dev/missions", label: "ミッション一覧" },
  { href: "/dev/design", label: "デザインの差し替え" },
  { href: "/dev/login", label: "開発用ログイン" },
  { href: "/dev/users", label: "ユーザー" },
] as const;

export function DevTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="開発ツール" className="border-b border-gray-200">
      <ul className="flex gap-1">
        {TABS.map(({ href, label }) => {
          const isActive = pathname === href;

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-4 py-2.5 text-sm font-bold transition-colors",
                  isActive
                    ? "border-primary text-brand-ink"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
