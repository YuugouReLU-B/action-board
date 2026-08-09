import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUserIsAdmin } from "@/features/admin/services/authorize-admin";

export const metadata: Metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * 運営用の管理画面。
 *
 * 管理者でなければ 404 を返す。存在自体を伏せたいので 403 ではなく 404。
 * **ただしこれは表示の制御でしかない。** サーバーアクションはURLを知っていれば
 * 直接呼べるので、更新処理側でも requireAdmin() を通すこと。
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await currentUserIsAdmin())) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold">
            <Link href="/admin/missions">管理画面</Link>
          </h1>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            管理者のみ
          </span>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
