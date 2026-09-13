-- プレゼント抽選応募パネル（マイページ表示）の設定テーブル。
-- 固定ID（'default'）の1行だけを持つシングルトンで、/admin から編集する。
CREATE TABLE lottery_settings (
  id VARCHAR PRIMARY KEY DEFAULT 'default',
  threshold_points INTEGER NOT NULL DEFAULT 1000,
  title TEXT NOT NULL DEFAULT 'プレゼント抽選応募',
  description TEXT NOT NULL DEFAULT '累計ポイントがしきい値に達すると応募できます。',
  button_label TEXT NOT NULL DEFAULT '応募フォームを開く',
  form_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO lottery_settings (id, threshold_points, title, description, button_label, form_url)
VALUES ('default', 1000, 'プレゼント抽選応募', '累計ポイントがしきい値に達すると応募できます。', '応募フォームを開く', '');

COMMENT ON TABLE lottery_settings IS 'プレゼント抽選応募パネルの設定（固定ID1行のシングルトン）。/admin/lottery から編集する。';
COMMENT ON COLUMN lottery_settings.threshold_points IS 'この累計ポイント（現在のアクティブシーズンのXP）以上で応募トークンを表示する閾値。';
COMMENT ON COLUMN lottery_settings.form_url IS '応募先の外部フォーム（Googleフォーム等）のURL。空文字の間は応募ボタンを表示しない。';

ALTER TABLE lottery_settings ENABLE ROW LEVEL SECURITY;

-- 内容自体は非公開情報ではなく、マイページ（ログインユーザー）から参照するため誰でも読める
CREATE POLICY "Anyone can read lottery settings"
  ON lottery_settings FOR SELECT
  USING (true);
