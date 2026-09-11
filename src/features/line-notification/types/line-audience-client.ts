/**
 * LINE公式アカウントのオーディエンス管理APIクライアントのインターフェース（ポート）。
 *
 * 実際のメッセージ配信は行わない。ユーザーをオーディエンスグループへ追加するだけで、
 * 配信文言・タイミングはLINE公式アカウント管理画面から運営が手動で行う想定。
 */
export interface LineAudienceClient {
  /**
   * 指定したLINEユーザーIDを、累計ポイント到達ユーザー向けオーディエンスグループへ追加する。
   */
  addUserId(lineUserId: string): Promise<void>;
}
