import { isSupabaseAuthCookie } from "@/lib/utils/auth-cookies";

describe("isSupabaseAuthCookie", () => {
  it("認証cookieを認識する", () => {
    expect(isSupabaseAuthCookie("sb-127-auth-token")).toBe(true);
    expect(isSupabaseAuthCookie("sb-kijylemmokeegoqxalny-auth-token")).toBe(
      true,
    );
  });

  it("分割された認証cookieも認識する", () => {
    expect(isSupabaseAuthCookie("sb-127-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookie("sb-127-auth-token.1")).toBe(true);
  });

  it("認証以外のcookieは対象にしない", () => {
    expect(isSupabaseAuthCookie("referral_code")).toBe(false);
    expect(isSupabaseAuthCookie("campaign_code")).toBe(false);
    expect(isSupabaseAuthCookie("line_login_state")).toBe(false);
    // PKCE用の一時cookie。ログアウトで消す必要はなく、消すと進行中の
    // ログインを壊しうるので対象外にする
    expect(isSupabaseAuthCookie("sb-127-auth-token-code-verifier")).toBe(false);
  });
});
