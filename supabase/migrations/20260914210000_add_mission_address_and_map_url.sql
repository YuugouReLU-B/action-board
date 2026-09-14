-- クエストの住所・Googleマップリンクを個別に保存できるようにする。
-- 緯度経度（latitude/longitude）は位置判定用の座標として既に存在するが、
-- 表示用の住所テキストと、地図検索クエリより正確な場合がある
-- Googleマップ共有URLは別に保持する。

ALTER TABLE public.missions
  ADD COLUMN address text,
  ADD COLUMN google_map_url text;

COMMENT ON COLUMN public.missions.address IS '表示用の住所テキスト';
COMMENT ON COLUMN public.missions.google_map_url IS 'Googleマップの共有URL（管理画面で個別入力）';

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
  m.difficulty            AS difficulty,
  m.points                AS points,
  m.latitude              AS latitude,
  m.longitude             AS longitude,
  m.radius_meters        AS radius_meters,
  m.content              AS content,
  m.created_at           AS created_at,
  m.artifact_label       AS artifact_label,
  m.max_achievement_count AS max_achievement_count,
  m.event_date           AS event_date,
  m.event_end_date       AS event_end_date,
  m.event_type            AS event_type,
  m.supplement            AS supplement,
  m.tag1                  AS tag1,
  m.tag2                  AS tag2,
  m.tag3                  AS tag3,
  m.is_featured            AS is_featured,
  m.updated_at            AS updated_at,
  m.is_hidden              AS is_hidden,
  m.ogp_image_url          AS ogp_image_url,
  m.required_artifact_type AS required_artifact_type,
  l.sort_no                AS link_sort_no,
  m.quest_category         AS quest_category,
  m.event_category         AS event_category,
  m.region                 AS region,
  m.address                AS address,
  m.google_map_url         AS google_map_url
FROM
  mission_category c
  INNER JOIN mission_category_link l ON c.id = l.category_id
  INNER JOIN missions m ON l.mission_id = m.id
WHERE
  c.del_flg = false
  AND l.del_flg = false
  AND m.is_hidden = false;

ALTER VIEW mission_category_view SET (security_invoker = true);
