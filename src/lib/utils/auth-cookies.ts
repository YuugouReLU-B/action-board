/**
 * Supabase の認証cookieの名前を判定する。
 *
 * 名前は `sb-<プロジェクト参照>-auth-token` で、値が大きいときは
 * `-auth-token.0` `-auth-token.1` のように分割されて入る。
 * プロジェクト参照は環境ごとに違うので、前後の形で判定する。
 */
export function isSupabaseAuthCookie(name: string): boolean {
  return /^sb-.+-auth-token(\.\d+)?$/.test(name);
}
