import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevTabs } from "@/features/dev-tools/components/dev-tabs";

export const metadata: Metadata = {
  title: "開発ツール",
  robots: { index: false, follow: false },
};

/**
 * 開発専用ページ。
 *
 * 本番ビルドでは常に 404 を返す。ページ一覧はファイルシステムを読み、
 * ミッション一覧は service_role でDBを読むため、外部に出してはいけない。
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold">開発ツール</h1>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              開発環境のみ
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            このページは本番ビルドでは 404 になります。
          </p>
        </header>

        <DevTabs />

        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
