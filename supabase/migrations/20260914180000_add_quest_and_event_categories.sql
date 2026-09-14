-- missions が分類の正。旧カテゴリ/YAMLの定義・紐付けは変更しない。
CREATE TYPE public.quest_category AS ENUM (
  'PERMANENT', 'SPECIAL_HAMADORI', 'SPECIAL_TOKYO', 'SNS'
);
CREATE TYPE public.event_category AS ENUM ('SPOT', 'SPORTS', 'ART', 'FOOD', 'MIXED');

ALTER TABLE public.missions
  ADD COLUMN quest_category public.quest_category,
  ADD COLUMN event_category public.event_category;

-- 複数の有効な旧カテゴリに属する場合はPERMANENTを優先する。
-- 未所属・未知区分は特設扱いにし、東京の明記がある場合だけ東京へ割り当てる。
UPDATE public.missions m
SET quest_category = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.mission_category_link l
    JOIN public.mission_category c ON c.id = l.category_id
    WHERE l.mission_id = m.id AND NOT l.del_flg AND NOT c.del_flg
      AND c.category_kbn = 'PERMANENT'
  ) THEN 'PERMANENT'::public.quest_category
  WHEN m.title LIKE '%東京%' THEN 'SPECIAL_TOKYO'::public.quest_category
  ELSE 'SPECIAL_HAMADORI'::public.quest_category
END;

-- 広い名称一致を先に適用し、収穫祭・コラボの個別指定で上書きする。
-- ワイナリー訪問/収穫祭、福土舎訪問/haccobaコラボの取り違えを防ぐ。
UPDATE public.missions
SET quest_category = 'PERMANENT', event_category = 'SPOT'
WHERE title LIKE ANY (ARRAY[
  '%タートルサイクル%', '%かわうちワイナリー%', '%ノーマ・ホースヴィレッジ%',
  '%福土舎%', '%図図倉庫%', '%陶吉郎窯%', '%ホテル双葉邸%'
]);

UPDATE public.missions
SET quest_category = 'SPECIAL_HAMADORI', event_category = 'SPORTS'
WHERE title LIKE ANY (ARRAY['%かわうちヒルクライム%', '%北泉サーフィン%', '%浜街道トレイル%']);

UPDATE public.missions
SET quest_category = 'SPECIAL_HAMADORI', event_category = 'ART'
WHERE title LIKE ANY (ARRAY['%浜通り食と芸術プロジェクト%', '%公界茶会%', '%いわきコスプレイベント%']);

UPDATE public.missions
SET quest_category = 'SPECIAL_HAMADORI', event_category = 'FOOD'
WHERE title LIKE ANY (ARRAY['%かわうちワイナリー収穫祭%', '%キウイ収穫体験%']);

UPDATE public.missions
SET quest_category = 'SPECIAL_HAMADORI', event_category = 'MIXED'
WHERE title LIKE '%浜フェス%'
   OR title LIKE '%おおくまハッカソン%2026%最終発表会%';

UPDATE public.missions
SET quest_category = 'SPECIAL_TOKYO', event_category = 'FOOD'
WHERE title ILIKE '%haccoba%福土舎%コラボ%';

UPDATE public.missions
SET quest_category = 'SPECIAL_TOKYO', event_category = 'MIXED'
WHERE title ILIKE '%FUKUSHIMA%HITONO-KAGAYAKI%';

UPDATE public.missions
SET quest_category = 'SNS', event_category = NULL
WHERE title LIKE '%公式LINE%友だち%'
   OR title LIKE '%LINE友だち登録%';

-- 既存のseed/外部登録との互換性のためDB既定値も設ける。
-- 管理画面は必須入力として明示的に保存する。
ALTER TABLE public.missions
  ALTER COLUMN quest_category SET NOT NULL,
  ALTER COLUMN quest_category SET DEFAULT 'PERMANENT';

COMMENT ON COLUMN public.missions.quest_category IS 'クエスト分類（常設・特設浜通り・特設東京・SNS登録）';
COMMENT ON COLUMN public.missions.event_category IS 'イベント分類と固定アイコン。NULLはフォールバック画像';

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
  m.points               AS points,
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
  m.event_category       AS event_category
FROM
  mission_category c
  INNER JOIN mission_category_link l ON c.id = l.category_id
  INNER JOIN missions m ON l.mission_id = m.id
WHERE
  c.del_flg = false
  AND l.del_flg = false
  AND m.is_hidden = false;


ALTER VIEW mission_category_view SET (security_invoker = true);
