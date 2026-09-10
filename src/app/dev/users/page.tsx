import { DevUserRow } from "@/features/dev-tools/components/dev-user-row";
import { listUsersForDevTools } from "@/features/dev-tools/services/dev-users";
import { getUser } from "@/features/user-profile/services/profile";

export const dynamic = "force-dynamic";

export default async function DevUsersPage() {
  const [users, currentUser] = await Promise.all([
    listUsersForDevTools(),
    getUser(),
  ]);

  const lineUsers = users.filter((u) => u.provider === "line").length;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">ユーザー一覧</h2>
        <p className="text-sm text-gray-600">
          全 {users.length} 人（LINE登録 {lineUsers} 人）
        </p>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        登録フローを繰り返し試すためのツールです。削除すると
        <strong>
          そのユーザーの達成・XP・バッジ・プロフィールもすべて消えます
        </strong>
        。 関連データの削除には本番の退会処理と同じ{" "}
        <code className="rounded bg-gray-100 px-1.5 py-0.5">
          delete_user_account
        </code>{" "}
        を使っているので、実際の退会と同じ結果になります。
      </p>

      <p className="mb-6 text-sm text-gray-600">
        自分自身を削除すると、そのままログイン画面に戻ります。LINEで登録し直すと
        新規ユーザー扱いになるので、初回の導線をもう一度確認できます。
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-bold">ユーザー</th>
              <th className="px-4 py-2.5 font-bold">登録経路</th>
              <th className="px-4 py-2.5 text-center font-bold">公式LINE</th>
              <th className="px-4 py-2.5 text-center font-bold">
                プロフィール
              </th>
              <th className="px-4 py-2.5 font-bold">作成日時</th>
              <th className="px-4 py-2.5 text-right font-bold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <DevUserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUser?.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="mt-4 text-sm text-gray-600">ユーザーがいません。</p>
      )}
    </section>
  );
}
