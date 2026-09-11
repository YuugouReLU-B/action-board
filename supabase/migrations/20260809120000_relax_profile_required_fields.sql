-- =============================================
-- プロフィール項目を「ニックネームのみ必須」に緩和する
-- =============================================
--
-- 背景:
--   派生元は政治団体のサポーター登録が前提で、生年月日（公職選挙法の18歳以上確認）
--   と郵便番号・都道府県を必須で取得していた。
--   浜通りクエストは道の駅などの来訪者に使ってもらうため、
--   これらを必須にする根拠がなく、登録のハードルにしかならない。
--
-- 方針（2026-08-09 決定）:
--   - ニックネーム（public_user_profiles.name）のみ必須のまま
--   - 生年月日と都道府県は「任意のアンケート項目」に格下げ（項目自体は残す）
--   - 郵便番号は取得をやめる（カラムは残すが NULL 許容にして書き込まない）
--   - 18歳以上制限は撤廃
--
--   アンケートとして収集を続けるか、項目ごと削るかは次回MTGで決める。
--   そのためカラムは DROP せず NULL 許容にとどめる。

ALTER TABLE private_users ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE private_users ALTER COLUMN postcode DROP NOT NULL;
ALTER TABLE public_user_profiles ALTER COLUMN address_prefecture DROP NOT NULL;

COMMENT ON COLUMN private_users.date_of_birth IS
  '任意。アンケート項目として収集する。18歳以上確認は廃止済み';
COMMENT ON COLUMN private_users.postcode IS
  '取得を停止した項目。新規の書き込みは行わない（次回MTGで削除可否を判断）';
COMMENT ON COLUMN public_user_profiles.address_prefecture IS
  '任意。訪問者の出身地（関係人口の可視化）に使うためアンケート項目として残す';
