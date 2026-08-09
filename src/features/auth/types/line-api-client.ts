/**
 * LINE APIトークンレスポンス
 */
export type LineTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  /**
   * bot_prompt を付けて認証した場合のみ返る。
   * **その認証で友だち状態が「変化したか」**であって、友だちかどうかではない。
   *
   * 友だち追加ミッションの判定にこれを使ってはいけない。
   * すでに友だちだったユーザーは変化しないので false になり、
   * 永久に達成できなくなる。判定には getFriendshipStatus()（friendFlag）を使うこと。
   */
  friendship_status_changed?: boolean;
};

/**
 * LINE APIクライアントのインターフェース（ポート）
 *
 * LINE OAuth2 APIとの通信を抽象化する。
 * テスト時にはFake実装に差し替え可能。
 */
export interface LineApiClient {
  exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<LineTokenResponse>;

  /**
   * リンクされたLINE公式アカウントと友だちかどうかを返す。
   *
   * 公式アカウントがリンクされていない場合など、判定できないときは null。
   * 付帯情報なのでエラーでログインを止めないこと。
   */
  getFriendshipStatus(accessToken: string): Promise<boolean | null>;
}
