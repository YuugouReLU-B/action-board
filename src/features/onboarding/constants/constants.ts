/**
 * オンボーディング機能で使用する定数
 */

// アニメーション関連の定数
export const ANIMATION_DURATION = {
  PAGE_TRANSITION: 150,
  SUBMISSION_COMPLETE: 300,
  SCROLL_ANIMATION: 1500,
} as const;

// スクロール関連の定数
export const SCROLL_OFFSET = {
  DEFAULT: 300,
  CARD_MARGIN: 20,
} as const;

// モックミッション（チームみらい公式サイト専用）
export const MOCK_MISSION = {
  id: "3",
  title: "チームみらい公式サイトを見てみよう！",
  artifact_label: null,
  content:
    "<p>チームみらいの公式サイトをぜひ見てみてください！</p><p>一緒により良い未来を作っていきましょう！</p><br/><a href='https://team-mir.ai/' target='_blank' rel='noopener noreferrer' class='transition-colors inline-flex items-center gap-1'>チームみらい公式サイト<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='inline-block'><path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'></path><polyline points='15 3 21 3 21 9'></polyline><line x1='10' y1='14' x2='21' y2='3'></line></svg></a>",
  icon_url:
    "/img/mission-icons/actionboard_icon_work_20250713_ol_link-official-site.svg",
  difficulty: 5,
  max_achievement_count: 1,
  event_date: null,
  required_artifact_type: "NONE" as const,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
  is_featured: false,
  is_hidden: false,
  ogp_image_url: null,
};

// ボタンテキスト
export const BUTTON_TEXT = {
  START: "説明を聞く",
  NEXT: "次へ",
  RECORD: "記録する",
  MISSION_COMPLETE: "完了済み",
  FINISH: "ミッションを探す 🔍",
} as const;

// スクロールテキスト
export const SCROLL_TEXT = "下にスクロール";

// Z-index層の定義
export const Z_INDEX = {
  ONBOARDING_MODAL: 60, // 他のモーダル(z-50)より上に表示
} as const;

// スタイルクラス名
export const STYLE_CLASSES = {
  MODAL_OVERLAY:
    "fixed inset-4 md:inset-6 lg:inset-12 z-60 duration-200 lg:max-w-4xl lg:mx-auto lg:left-0 lg:right-0",
  BACKGROUND_GRADIENT:
    "bg-linear-to-b from-[var(--app-onboarding-from)] to-[var(--app-onboarding-to)]",
  CHARACTER_COMMENT:
    "text-gray-800 text-sm sm:text-base md:text-lg leading-relaxed text-center font-medium px-4 py-2",
  BUTTON_PRIMARY:
    "bg-white text-gray-800 hover:bg-white/90 text-base py-3 rounded-full shadow-lg font-medium w-[50vw] sm:w-32 md:w-48 lg:w-52",
  BUTTON_SUBMIT:
    "w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed",
} as const;
