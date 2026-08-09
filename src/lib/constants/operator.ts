import { APP_ORIGIN } from "@/lib/constants/app-origin";

/**
 * 本サービスの運営主体。
 *
 * 利用規約・プライバシーポリシーで名乗る主体であり、法的な責任の所在そのもの。
 * 派生元（政治団体「チームみらい」）のままでは事実と異なるため暫定値に置き換えてある。
 *
 * **`isProvisional` が true の間は公開してはいけない。**
 * 運営主体（団体名・問い合わせ先）が決まっていないことを画面上でも明示するために、
 * それらしい仮の団体名やメールアドレスを埋めるのではなく、未定であることを表示する。
 *
 * TODO(次回MTG): 運営主体を決めて name / contactEmail を確定し、isProvisional を false にする。
 */
export const OPERATOR = {
  name: "（運営主体は決定次第記載します）",
  contactEmail: null,
  /** 公式ドメイン。非公式サービスと区別するための記載に使う */
  officialUrl: APP_ORIGIN,
  isProvisional: true,
} as const;
