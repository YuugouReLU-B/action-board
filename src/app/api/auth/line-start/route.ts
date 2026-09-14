import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
  getBotPrompt,
  LINE_AUTHORIZE_ENDPOINT,
  LINE_LOGIN_COOKIE,
  LINE_LOGIN_COOKIE_MAX_AGE,
  LINE_LOGIN_SCOPE,
} from "@/features/auth/constants/line-login";
import { LINE_REDIRECT_URI } from "@/lib/constants/app-origin";
import { validateReturnUrl } from "@/lib/validation/url";

/**
 * LINEログインを開始するルートハンドラ。
 *
 * 以前はクライアントから Server Action (startLineLogin) を await してから
 * `window.location.href` で遷移していたが、その非同期の間隙のせいで
 * iOSの「ユーザー操作から連続した遷移」判定が外れやすくなっていた。
 * ボタンを素の `<a href>` にしてこのルートへの単一のブラウザ遷移にすることで、
 * ユーザー操作と遷移が地続きになるようにしてある。
 *
 * それとは別に、実機でChrome/Safariどちらでも access.line.me 上でエラー
 * （Chrome: 一瞬 "Application error" → 自然にログインフォームへ復帰、
 *   Safari: 最初から「ログインできませんでした。」の状態で表示）が出る事象が
 * あった。これはLINEの「自動ログイン」機能
 * （Universal Links/App LinksでLINEアプリをバックグラウンド起動し、無操作で
 * ログインを完了させる機能）が失敗した際の挙動そのもので、LINE公式ドキュメント
 * にも「OSの仕様上、失敗条件をLINE側でも完全には制御できない」と明記されている。
 * disable_auto_login=true を付けて自動ログイン自体を無効化することで、
 * この不安定な自動起動を経由せず最初から通常のログイン画面
 * （SSOが有効ならSSO、そうでなければメール/パスワード）を出す。
 * 参照: https://developers.line.biz/en/docs/line-login/how-to-handle-auto-login-failure/
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
  if (!clientId) {
    console.error("NEXT_PUBLIC_LINE_CLIENT_ID is not set");
    return NextResponse.redirect(
      new URL(
        "/sign-in?error=LINE認証の設定が不完全です。管理者にお問い合わせください。",
        request.url,
      ),
    );
  }

  const state = randomBytes(32).toString("base64url");

  const cookieStore = await cookies();
  const cookieOptions = {
    maxAge: LINE_LOGIN_COOKIE_MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set(LINE_LOGIN_COOKIE.state, state, cookieOptions);

  const returnUrl = request.nextUrl.searchParams.get("returnUrl");
  const safeReturnUrl = validateReturnUrl(returnUrl);
  if (safeReturnUrl) {
    cookieStore.set(LINE_LOGIN_COOKIE.returnUrl, safeReturnUrl, cookieOptions);
  }

  const authorizeUrl = new URL(LINE_AUTHORIZE_ENDPOINT);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", LINE_REDIRECT_URI);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", LINE_LOGIN_SCOPE);
  // LINEの「自動ログイン」（Universal Links/App LinksでLINEアプリをバックグラウンド
  // 起動し、無操作でログインを完了させる機能）を無効化する。
  // LINE公式ドキュメントいわく、OSの仕様上LINE側でも失敗条件を完全には制御できず、
  // 失敗時はaccess.line.me上でエラー表示になる（実機で確認した症状と一致）。
  // 参照: https://developers.line.biz/en/docs/line-login/how-to-handle-auto-login-failure/
  authorizeUrl.searchParams.set("disable_auto_login", "true");

  const botPrompt = getBotPrompt();
  if (botPrompt) {
    authorizeUrl.searchParams.set("bot_prompt", botPrompt);
  }

  return NextResponse.redirect(authorizeUrl);
}
