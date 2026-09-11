-- ミッション（イベント）のアイコン・写真アップロード用のストレージバケットを作成
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'mission-assets',
  'mission-assets',
  true, -- パブリックアクセス可能
  false, -- avif自動検出無効
  5242880, -- ファイルサイズ制限 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] -- 許可するMIMEタイプ
);

-- URLを知っていれば誰でも参照可能にする（ミッションカード表示などのため）
CREATE POLICY "anyone can view mission-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mission-assets');

-- 書き込みは管理画面のServer Action（service_role）からのみ行うため、
-- authenticatedユーザー向けのINSERT/UPDATE/DELETEポリシーは設定しない
