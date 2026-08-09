-- ミッションにポイントと座標を持たせ、QRスポット用のコードテーブルを追加する。
--
-- これまでXPは difficulty(1-5) からコード側で導出していたため、
-- ミッションごとに任意のポイントを設定できなかった。
-- 「このスポットは遠いから300点」ができるようにする。

-- ── 1. ポイント ─────────────────────────────────────────
ALTER TABLE missions
  ADD COLUMN points integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN missions.points IS '達成時に付与する基礎XP。is_featured なら2倍になる';
COMMENT ON COLUMN missions.difficulty IS '難易度(1-5)。★表示と並び替えに使う。XPには影響しない';

-- 既存ミッションは従来の導出式で埋め、挙動を変えない
UPDATE missions SET points = CASE difficulty
  WHEN 1 THEN 50
  WHEN 2 THEN 100
  WHEN 3 THEN 200
  WHEN 4 THEN 400
  WHEN 5 THEN 800
  ELSE 50
END;

ALTER TABLE missions
  ADD CONSTRAINT missions_points_non_negative CHECK (points >= 0);

-- ── 2. 座標 ─────────────────────────────────────────────
-- ベータでは位置による不正判定は行わないが、周遊の可視化と
-- 後から半径判定を足すために器だけ用意しておく。
ALTER TABLE missions
  ADD COLUMN latitude  double precision,
  ADD COLUMN longitude double precision;

COMMENT ON COLUMN missions.latitude IS 'QRスポットの緯度。スポット以外はNULL';
COMMENT ON COLUMN missions.longitude IS 'QRスポットの経度。スポット以外はNULL';

ALTER TABLE missions
  ADD CONSTRAINT missions_latitude_range
    CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
  ADD CONSTRAINT missions_longitude_range
    CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180));

-- ── 3. QRコード ─────────────────────────────────────────
-- missions は select_all_missions で全員がSELECTできる。
-- コードを missions の行に持たせると anon キーで全スポットのコードを
-- 一覧取得でき、現地に行かずに全ポイントを取得できてしまう。
-- 必ず別テーブルに分け、RLSポリシーを一切作らないことで
-- service_role 以外からは読めないようにする。
CREATE TABLE mission_qr_codes (
  mission_id uuid PRIMARY KEY REFERENCES missions(id) ON DELETE CASCADE,
  code       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE mission_qr_codes IS 'QRスポットの読み取りコード。service_role からのみ参照できる';
COMMENT ON COLUMN mission_qr_codes.code IS 'QRに埋め込む推測不能な文字列。再発行すると旧コードは無効になる';

ALTER TABLE mission_qr_codes ENABLE ROW LEVEL SECURITY;
-- ポリシーを作らない = anon / authenticated からは SELECT も INSERT もできない

-- anon / authenticated には権限自体を与えない（RLSの手前で止める）
REVOKE ALL ON TABLE mission_qr_codes FROM anon, authenticated;
GRANT ALL ON TABLE mission_qr_codes TO service_role;

CREATE TRIGGER update_mission_qr_codes_updated_at
  BEFORE UPDATE ON mission_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
