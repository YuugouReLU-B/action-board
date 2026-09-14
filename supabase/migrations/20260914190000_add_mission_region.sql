-- ミッションカードに表示する「地域」用の構造化カラムを追加する。
-- 従来は tag1（自由記述）を地域チップとして流用していたが、表記ゆれや
-- 誤入力を避けるため固定の選択肢（ENUM）にする。

CREATE TYPE public.mission_region AS ENUM (
  'IWAKI', 'HIRONO', 'NARAHA', 'TOMIOKA', 'OKUMA', 'FUTABA', 'NAMIE',
  'KATSURAO', 'KAWAUCHI', 'MINAMISOMA', 'IITATE', 'SHINCHI', 'SOMA',
  'TOKYO', 'WIDE'
);

ALTER TABLE public.missions
  ADD COLUMN region public.mission_region;

COMMENT ON COLUMN public.missions.region IS
  '地域（市区町村単位、東京、または複数市町村にまたがる場合はWIDE）。カード表示用';

-- タイトルから地域を特定できるものだけを一括設定する。
-- 未特定（例: SNS登録系ミッション）は region を NULL のままにする。
UPDATE public.missions SET region = 'TOMIOKA' WHERE title LIKE '%タートルサイクル%';
UPDATE public.missions SET region = 'KAWAUCHI' WHERE title LIKE ANY (ARRAY['%かわうちワイナリー%', '%かわうちヒルクライム%']);
UPDATE public.missions SET region = 'NAMIE' WHERE title LIKE ANY (ARRAY['%ノーマ・ホースヴィレッジ%', '%浜フェス%', '%公界茶会%']);
UPDATE public.missions SET region = 'MINAMISOMA' WHERE title LIKE ANY (ARRAY['%福土舎%', '%北泉サーフィン%']);
UPDATE public.missions SET region = 'IITATE' WHERE title LIKE '%図図倉庫%';
UPDATE public.missions SET region = 'IWAKI' WHERE title LIKE ANY (ARRAY['%陶吉郎窯%', '%いわきコスプレイベント%']);
UPDATE public.missions SET region = 'HIRONO' WHERE title LIKE '%ホテル双葉邸%';
UPDATE public.missions SET region = 'OKUMA' WHERE title LIKE ANY (ARRAY['%キウイ収穫体験%', '%おおくまハッカソン%']);
UPDATE public.missions SET region = 'WIDE' WHERE title LIKE ANY (ARRAY['%浜通り食と芸術プロジェクト%', '%浜街道トレイル%']);
UPDATE public.missions SET region = 'TOKYO' WHERE title ILIKE ANY (ARRAY['%haccoba%福土舎%コラボ%', '%FUKUSHIMA%HITONO-KAGAYAKI%']);

-- 列は末尾に追加し、既存列・権限・security_invokerを保持する。
CREATE OR REPLACE VIEW mission_category_view AS
SELECT
  c.id                   AS category_id,
  c.category_title       AS category_title,
  c.category_kbn         AS category_kbn,
  c.sort_no              AS category_sort_no,
  m.id                   AS mission_id,
  m.slug                 AS slug,
  m.title                AS title,
  m.icon_url             AS icon_url,
  m.difficulty           AS difficulty,
  m.points                AS points,
  m.latitude             AS latitude,
  m.longitude            AS longitude,
  m.radius_meters        AS radius_meters,
  m.content              AS content,
  m.created_at           AS created_at,
  m.artifact_label       AS artifact_label,
  m.max_achievement_count AS max_achievement_count,
  m.event_date           AS event_date,
  m.event_end_date       AS event_end_date,
  m.event_type           AS event_type,
  m.supplement           AS supplement,
  m.tag1                 AS tag1,
  m.tag2                 AS tag2,
  m.tag3                 AS tag3,
  m.is_featured          AS is_featured,
  m.updated_at           AS updated_at,
  m.is_hidden            AS is_hidden,
  m.ogp_image_url        AS ogp_image_url,
  m.required_artifact_type AS required_artifact_type,
  l.sort_no              AS link_sort_no,
  m.quest_category       AS quest_category,
  m.event_category       AS event_category,
  m.region                AS region
FROM
  mission_category c
  INNER JOIN mission_category_link l ON c.id = l.category_id
  INNER JOIN missions m ON l.mission_id = m.id
WHERE
  c.del_flg = false
  AND l.del_flg = false
  AND m.is_hidden = false;

ALTER VIEW mission_category_view SET (security_invoker = true);
