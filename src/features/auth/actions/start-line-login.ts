"use server";

import { randomBytes } from "node:crypto";
import {
  LINE_AUTHORIZE_ENDPOINT,
  LINE_LOGIN_COOKIE,
  LINE_LOGIN_COOKIE_MAX_AGE,
  LINE_LOGIN_SCOPE,
} from "@/features/auth/constants/line-login";
import { LINE_REDIRECT_URI } from "@/lib/constants/app-origin";
import { setCookie } from "@/lib/utils/server-cookies";
import { validateReturnUrl } from "@/lib/validation/url";

type StartLineLoginInput = {
  /** 新規登録フローから来た場合のみ渡る */
  dateOfBirth?: string;
  /** ログイン後の戻り先 */
  returnUrl?: string;
};

/**
 * LINEログインを開始する。
 *
 * state と、フロー中だけ必要な値（生年月日・戻り先）を HttpOnly cookie に保存し、
 * authorize URL を返す。呼び出し側はその URL に遷移するだけ。
 * 照合はコールバックのルートハンドラがサーバー側で行う。
 */
export async function startLineLogin({
  dateOfBirth,
  returnUrl,
}: StartLineLoginInput = {}): Promise<
  { success: true; authorizeUrl: string } | { success: false; error: string }
> {
  const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
  if (!clientId) {
    console.error("NEXT_PUBLIC_LINE_CLIENT_ID is not set");
    return {
      success: false,
      error: "LINE認証の設定が不完全です。管理者にお問い合わせください。",
    };
  }

  const state = randomBytes(32).toString("base64url");

  const cookieOptions = {
    maxAge: LINE_LOGIN_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  await setCookie(LINE_LOGIN_COOKIE.state, state, cookieOptions);

  if (dateOfBirth) {
    await setCookie(LINE_LOGIN_COOKIE.dateOfBirth, dateOfBirth, cookieOptions);
  }

  // オープンリダイレクト対策。保存する前に検証しておく
  const safeReturnUrl = validateReturnUrl(returnUrl);
  if (safeReturnUrl) {
    await setCookie(LINE_LOGIN_COOKIE.returnUrl, safeReturnUrl, cookieOptions);
  }

  const authorizeUrl = new URL(LINE_AUTHORIZE_ENDPOINT);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", LINE_REDIRECT_URI);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", LINE_LOGIN_SCOPE);

  return { success: true, authorizeUrl: authorizeUrl.toString() };
}
