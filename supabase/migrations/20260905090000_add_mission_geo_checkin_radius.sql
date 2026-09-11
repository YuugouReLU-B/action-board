-- 位置情報チェックイン（GEO_CHECKIN）ミッション用の判定半径を追加する。
--
-- QRと同じく missions.latitude / longitude を「その場所」として使い、
-- ここに追加する radius_meters を「その場所から何m以内なら達成とするか」
-- の判定に使う。QRスポットは v1 では位置判定をしない方針のため、
-- radius_meters が NULL のままでも QR 側の挙動には影響しない。

ALTER TABLE missions
  ADD COLUMN radius_meters integer;

COMMENT ON COLUMN missions.radius_meters IS
  '位置情報チェックインの判定半径(m)。GEO_CHECKIN以外はNULLでよい';

ALTER TABLE missions
  ADD CONSTRAINT missions_radius_meters_positive
    CHECK (radius_meters IS NULL OR radius_meters > 0);
