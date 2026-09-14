/**
 * LINEログイン開始リンクの組み立て。
 *
 * 以前はサーバーアクション（startLineLogin）をawaitしてから
 * `window.location.href` で遷移していた。しかしその非同期の間隙のせいで、
 * iOS Safariが「ユーザー操作から連続した遷移」と認識できなくなり、
 * LINEアプリがインストール済みでもアプリを起動せず常にWebのログイン画面が
 * 出てしまう不具合があった。
 *
 * state の生成・cookie保存・authorize URLの組み立ては
 * すべて `/api/auth/line-start` ルートハンドラ側で行う。
 * クライアントはそこへの素の `<a href>` を組み立てるだけにして、
 * クリックからそのルートへの遷移までを一つの連続したブラウザ遷移にする。
 */
export function buildLineLoginHref(returnUrl?: string): string {
  const params = new URLSearchParams();
  if (returnUrl) {
    params.set("returnUrl", returnUrl);
  }
  const query = params.toString();
  return query ? `/api/auth/line-start?${query}` : "/api/auth/line-start";
}
