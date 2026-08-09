/**
 * LINEログインのフロー中だけ使う一時cookie。
 *
 * 以前は state と生年月日を localStorage に置き、クライアント側で照合していた。
 * その方式だと state 検証をクライアントで済ませたあとサーバーアクションに
 * code を渡す形になり、サーバー側では state を一切見ていなかった
 * （＝サーバーアクションを直接叩けば検証を素通りできる）。
 *
 * HttpOnly cookie に移してコールバックのルートハンドラで照合する。
 */
export const LINE_LOGIN_COOKIE = {
  /** CSRF対策の state */
  state: "line_login_state",
  /** 新規登録時のみ渡ってくる生年月日 */
  dateOfBirth: "line_login_dob",
  /** ログイン後の戻り先 */
  returnUrl: "line_login_return",
} as const;

/** 一時cookieの有効期限（秒）。認証フローを往復するだけなので短くてよい */
export const LINE_LOGIN_COOKIE_MAX_AGE = 60 * 10;

export const LINE_AUTHORIZE_ENDPOINT =
  "https://access.line.me/oauth2/v2.1/authorize";

/**
 * 要求するスコープ。
 *
 * email は含めない。LINE のメールアドレス取得は Developers での審査申請が必要で、
 * かつ「個人情報を持たない」方針に反する。メールが取れない場合は
 * line-{lineUserId}@line.local を合成して使う（line-login.ts 参照）。
 */
export const LINE_LOGIN_SCOPE = "profile openid";

/**
 * 認証フロー中に公式アカウントの友だち追加を促すかどうか。
 *
 * - `aggressive`: 同意後に友だち追加専用の画面を出す（取りこぼしが少ない）
 * - `normal`: 同意画面にチェックボックスを出す
 * - 未設定: 何もしない
 *
 * **LINEログインチャネルに公式アカウントがリンクされていないと機能しない**ため、
 * リンクが済むまでは未設定にしておく（環境変数で切り替える）。
 */
export function getBotPrompt(): "aggressive" | "normal" | null {
  const value = process.env.NEXT_PUBLIC_LINE_BOT_PROMPT;
  return value === "aggressive" || value === "normal" ? value : null;
}
