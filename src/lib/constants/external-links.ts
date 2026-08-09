// 外部リンク設定
//
// TODO(次回MTG): faq / feedback_* は派生元（チームみらい）の Notion / Google Forms を
// 指したままになっている。浜通りクエスト用の受け口を用意して差し替えること。
// 運営主体（法人登記）が決まるまで置き換え先が確定しないため保留している。
export const EXTERNAL_LINKS = {
  // FAQ
  faq: "https://team-mirai.notion.site/228f6f56bae18037957dd5f108d00e2f",

  // ご意見箱
  feedback_action_board:
    "https://team-mirai.notion.site/204f6f56bae1800da8d5dd9c61dd7cd1?pvs=105",
  feedback_poster_map: "https://forms.gle/vyVkGb4CbNahggfW8",

  // SNS指名検索（シェア導線の受け皿。タグは #浜通りクエスト に差し替え済み）
  x_search_hamadori: "https://x.com/search?q=%23浜通りクエスト",
  note_search_hamadori: "https://note.com/search?q=浜通りクエスト",
} as const;
// 利用側で `keyof typeof EXTERNAL_LINKS` を直接書く手間を省く
export type ExternalLinkKey = keyof typeof EXTERNAL_LINKS;
