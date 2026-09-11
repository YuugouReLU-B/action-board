import { type NextRequest, NextResponse } from "next/server";

/**
 * ベータ公開前のサイト全体をBasic認証で塞ぐ。
 *
 * Vercel の Deployment Protection でも同じことができるが、あちらは
 * 閲覧者に Vercel アカウントとチームへの招待が要る。関係者に URL とパスワードを
 * 渡すだけで見せられるほうが運用しやすいのでコード側に置く。
 *
 * **環境変数が未設定なら何もしない。** ローカル開発と CI を止めないため。
 * 公開時はこの2つを消せば解除できる。
 */
// HTTPヘッダーの値はByteStringなので日本語を入れると送信時に落ちる。ASCIIで書く
const REALM = "Hamadori Quest (preview)";

function getCredentials(): { user: string; password: string } | null {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !password) {
    return null;
  }
  return { user, password };
}

/**
 * 文字列を定数時間で比較する。
 *
 * Edge ランタイムでも動くよう node:crypto の timingSafeEqual は使わない。
 * 長さの違いだけは早期に分かってしまうが、パスワードの長さが漏れても
 * ベータ用のゲートとしては許容範囲。
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** `Basic <base64>` を user / password に分解する。壊れていれば null */
export function parseBasicAuthHeader(
  header: string | null,
): { user: string; password: string } | null {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  let decoded: string;
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return null;
  }

  // パスワードに ":" が含まれうるので最初の1個だけで区切る
  const separator = decoded.indexOf(":");
  if (separator === -1) {
    return null;
  }

  return {
    user: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

export function createUnauthorizedResponse(): NextResponse {
  return new NextResponse("認証が必要です", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      // 認証前のレスポンスをCDNに残さない
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Basic認証を通すべきなら null、弾くなら 401 レスポンスを返す。
 */
export function resolveBasicAuthResponse(
  request: NextRequest,
): NextResponse | null {
  const credentials = getCredentials();
  if (!credentials) {
    return null;
  }

  const provided = parseBasicAuthHeader(request.headers.get("authorization"));
  if (!provided) {
    return createUnauthorizedResponse();
  }

  const matched =
    safeEqual(provided.user, credentials.user) &&
    safeEqual(provided.password, credentials.password);

  return matched ? null : createUnauthorizedResponse();
}
