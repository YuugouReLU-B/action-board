-- =============================================
-- 派生元から引き継いだシーズンを浜通りクエスト用の1本に整理する
-- =============================================
--
-- 背景:
--   派生元のマイグレーションが season1（~2025参院選）/ season2（~2026衆院選）/
--   season3（2026春~）を作成する。これらは選挙名がフッターの「過去シーズン」に
--   露出するうえ、season3 が is_active = true のままだと
--   season_data/seasons.yaml の同期後に is_active な行が2本になる。
--
--   getCurrentSeason() は .eq("is_active", true).single() で取得するため、
--   is_active な行が0本でも2本以上でもエラーになり、ミッション達成が失敗する。
--   （src/lib/services/seasons.ts / achieve-mission.ts）
--
-- 方針:
--   シーズン機能そのものは残す（11月末で締めて翌年再開する運用に必要）。
--   ここでは行の整理だけを行い、名称・期間の管理は引き続き
--   season_data/seasons.yaml が担う。

-- 1. 一旦すべて非アクティブにする（is_active な行を1本に収束させるため）
UPDATE seasons SET is_active = false, updated_at = now();

-- 2. 参照されていない引き継ぎシーズンを削除する。
--    season_id は achievements / xp_transactions / user_levels / user_badges から
--    FK 参照されており ON DELETE 指定がないため、実データがある環境では
--    削除せずに残す（非アクティブのままアーカイブとして残る）。
DELETE FROM seasons s
WHERE s.slug IN ('season2', 'season3')
  AND NOT EXISTS (SELECT 1 FROM achievements a WHERE a.season_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM xp_transactions x WHERE x.season_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM user_levels l WHERE l.season_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM user_badges b WHERE b.season_id = s.id);

-- 3. 残った引き継ぎシーズンから選挙名を消す（実データがあり削除できなかった場合）
UPDATE seasons SET name = '過去シーズン 1', updated_at = now()
WHERE slug = 'season2' AND name LIKE '%衆院選%';

UPDATE seasons SET name = '過去シーズン 2', updated_at = now()
WHERE slug = 'season3' AND name = '2026春~';

-- 4. season1 を浜通りクエストのβシーズンとして再定義し、唯一のアクティブにする。
--    以降の名称・期間の変更は season_data/seasons.yaml 側で行うこと。
INSERT INTO seasons (slug, name, start_date, end_date, is_active)
VALUES (
  'season1',
  '2026 浜通りクエスト β',
  '2026-10-01 00:00:00+09',
  '2026-11-30 23:59:59+09',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_active = true,
  updated_at = now();
