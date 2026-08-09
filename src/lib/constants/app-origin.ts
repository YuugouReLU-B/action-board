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
export const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";

export const LINE_CALLBACK_PATH = "/api/auth/line-callback";

export const LINE_REDIRECT_URI = `${APP_ORIGIN}${LINE_CALLBACK_PATH}`;
