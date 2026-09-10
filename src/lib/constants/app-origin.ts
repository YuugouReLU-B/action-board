/**
 * アプリのオリジンと LINE ログインのコールバックURL。
 *
 * LINE は authorize リクエスト時と token 交換時の redirect_uri が
 * **完全一致**していないと invalid_grant で失敗する。
 * 以前は authorize 側が window.location.origin、token 交換側が
 * headers().get("origin") と別々の値を使っており、
 * www の有無・プレビューURL・プロキシで Origin が落ちるケースで
 * 本番のログインが壊れる状態だった。
 *
 * そのため両方をこの定数から引くこと。値は LINE Developers の
 * コールバックURL設定とも一致させる必要がある。
 */
/**
 * オリジンを表す環境変数がこのアプリには2つあった。
 *
 * - `NEXT_PUBLIC_APP_ORIGIN`: LINEログインとQRコードで使う（この定数）
 * - `NEXT_PUBLIC_SITE_URL`: OGP・メール・認証コールバックで使っていた派生元由来のもの
 *
 * 2つあると片方だけ設定して気づかない。実際、本番で `NEXT_PUBLIC_SITE_URL` が
 * 未設定のままOGP画像が `http://localhost:3000` を指していた。
 * **参照はこの定数に一本化する。** 旧変数は移行のためのフォールバックとして
 * 読むだけにとどめ、新しいコードから直接参照しないこと。
 */
export const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

export const LINE_CALLBACK_PATH = "/api/auth/line-callback";

export const LINE_REDIRECT_URI = `${APP_ORIGIN}${LINE_CALLBACK_PATH}`;
