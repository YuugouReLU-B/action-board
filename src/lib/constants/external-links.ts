// 外部リンク設定
//
// TODO(次回MTG): faq は派生元（チームみらい）の Notion を指したままになっている。
// 浜通りクエスト用の受け口を用意して差し替えること。
export const EXTERNAL_LINKS = {
  // FAQ
  faq: "https://team-mirai.notion.site/228f6f56bae18037957dd5f108d00e2f",

  // ご意見箱。当面は浜通りサークルの問い合わせページに寄せる。
  // TODO: 浜通りクエスト専用のフォームを用意する（内容と項目は要検討）
  feedback_action_board: "https://hamadoori-circle.com/contact",

  // SNS指名検索（シェア導線の受け皿。タグは #浜通りクエスト に差し替え済み）
  x_search_hamadori: "https://x.com/search?q=%23浜通りクエスト",
  note_search_hamadori: "https://note.com/search?q=浜通りクエスト",
} as const;
// 利用側で `keyof typeof EXTERNAL_LINKS` を直接書く手間を省く
export type ExternalLinkKey = keyof typeof EXTERNAL_LINKS;
