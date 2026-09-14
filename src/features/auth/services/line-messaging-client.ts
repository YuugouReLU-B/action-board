/**
 * Messaging API（チャネルアクセストークン）で友だち状態を確認する。
 *
 * LINE Login の friendship/v1/status は「ユーザー本人のアクセストークン」が
 * 必要で、それを取り直すには毎回LINEログインをやり直す必要がありUXが悪い。
 * 一方この get profile エンドポイントは公式アカウント側のチャネルアクセス
 * トークンだけで呼べるため、ユーザーに何も操作させずに確認できる。
 * 友だちなら200、友だちでない（未追加・ブロック済み）なら404を返す。
 */
export async function checkLineFriendshipByUserId(
  lineUserId: string,
  channelAccessToken: string,
): Promise<boolean | null> {
  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${encodeURIComponent(lineUserId)}`,
      {
        headers: { Authorization: `Bearer ${channelAccessToken}` },
      },
    );

    if (response.status === 404) return false;
    if (!response.ok) {
      console.warn(
        `友だち状態の取得に失敗: ${response.status} ${await response.text()}`,
      );
      return null;
    }
    return true;
  } catch (error) {
    console.warn("友だち状態の取得でエラー:", error);
    return null;
  }
}
