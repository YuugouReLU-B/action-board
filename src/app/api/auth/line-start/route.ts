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
 * iOSの「ユーザー操作から連続した遷移」判定が外れ、LINEアプリがインストール
 * 済みでもアプリを開かず常にWebのログイン画面が出てしまっていた
 * （ユーザー報告: 「lineアプリが入っているのにこの画面になった」）。
 *
 * ボタンを素の `<a href>` にしてこのルートへの単一のブラウザ遷移にすることで、
 * ユーザー操作と遷移が地続きになり、iOS側のアプリ起動判定が働くようにする。
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

  const botPrompt = getBotPrompt();
  if (botPrompt) {
    authorizeUrl.searchParams.set("bot_prompt", botPrompt);
  }

  return NextResponse.redirect(authorizeUrl);
}
