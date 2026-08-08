import Link from "next/link";
import { listAppRoutes } from "@/features/dev-tools/services/route-inventory";

export const dynamic = "force-dynamic";

export default function DevPagesPage() {
  const routes = listAppRoutes();
  const dynamicCount = routes.filter((entry) => entry.isDynamic).length;
  const protectedCount = routes.filter((entry) => entry.isProtected).length;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">ページ一覧</h2>
        <p className="text-sm text-gray-600">
          全 {routes.length} ページ（動的 {dynamicCount} / ログイン必須{" "}
          {protectedCount}）
        </p>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        <code className="rounded bg-gray-100 px-1.5 py-0.5">src/app</code>{" "}
        を走査して実在する page ファイルから生成しています。動的ルートは URL
        にパラメータが必要なため、そのままでは開けません。
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-bold">ルート</th>
              <th className="px-4 py-2.5 font-bold">区分</th>
              <th className="px-4 py-2.5 font-bold">ファイル</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {routes.map((entry) => (
              <tr key={entry.route} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono">
                  {entry.isDynamic ? (
                    <span className="text-gray-700">{entry.route}</span>
                  ) : (
                    <Link
                      href={entry.route}
                      className="text-primary underline underline-offset-2"
                    >
                      {entry.route}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {entry.isProtected && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800">
                        ログイン必須
                      </span>
                    )}
                    {entry.isDynamic && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-800">
                        動的: {entry.dynamicSegments.join(", ")}
                      </span>
                    )}
                    {!entry.isProtected && !entry.isDynamic && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                        公開
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                  {entry.file}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
