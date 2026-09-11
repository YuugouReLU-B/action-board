-- 登録経路（プロバイダ種別・LINE公式アカウント友だち状態）をBigQuery連携用にミラーする
--
-- 背景:
--   運営から「どこから登録した人が何個のイベントに行くか」等の分析ニーズがあり、
--   登録経路別の集計をBQ側で行いたい。ただし auth.users.raw_user_meta_data の
--   provider / line_official_account_friend は、社内公開用のBQパイプラインには
--   乗っていない（20260716073000 の public.user_emails と同じ理由で、auth
--   スキーマを直接レプリケーション対象にできないため）。
--
-- 方針:
--   public.user_emails と全く同じパターン（ミラーテーブル + auth.users への
--   トリガーで同期）で public.user_registration_channels を追加する。
--   line_user_id 自体はPIIに近く、分析要件（登録経路別の集計）には不要なため
--   含めない（要件定義ドキュメント参照）。

-- 1. ミラーテーブル
CREATE TABLE IF NOT EXISTS public.user_registration_channels (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  provider TEXT,
  line_official_account_friend BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_registration_channels IS 'auth.users.raw_user_meta_data の登録経路情報のミラー。データ分析基盤(BigQuery)連携専用。アプリからは参照しない';
COMMENT ON COLUMN public.user_registration_channels.id IS 'ユーザーのUUID。auth.users.id を参照';
COMMENT ON COLUMN public.user_registration_channels.provider IS '登録経路（line / email 等）。raw_user_meta_data->>''provider''';
COMMENT ON COLUMN public.user_registration_channels.line_official_account_friend IS 'LINE公式アカウントの友だち状態（判定できていない場合はNULL）。raw_user_meta_data->>''line_official_account_friend''';
COMMENT ON COLUMN public.user_registration_channels.created_at IS 'auth.users.created_at のミラー（ユーザー登録日時）';
COMMENT ON COLUMN public.user_registration_channels.updated_at IS 'このミラー行が最後に同期された日時';

-- 2. アプリからのアクセスを遮断（RLS有効・ポリシーなし + 明示的REVOKE）
ALTER TABLE public.user_registration_channels ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_registration_channels FROM anon, authenticated;

-- 3. 同期トリガー
--    auth.users への書き込みは supabase_auth_admin が行うため、
--    public テーブルへ書き込めるよう SECURITY DEFINER にする（所有者は postgres）
CREATE OR REPLACE FUNCTION public.sync_user_registration_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_registration_channels (
    id, provider, line_official_account_friend, created_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'provider',
    (NEW.raw_user_meta_data ->> 'line_official_account_friend')::boolean,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET provider = EXCLUDED.provider,
        line_official_account_friend = EXCLUDED.line_official_account_friend,
        updated_at = now();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- ミラー更新の失敗でサインアップ・ログイン等の認証処理を止めない
    RAISE WARNING 'sync_user_registration_channel failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_user_registration_channel() IS 'auth.users の INSERT / raw_user_meta_data UPDATE を public.user_registration_channels に同期する（BigQuery連携用）';

DROP TRIGGER IF EXISTS trg_sync_user_registration_channel ON auth.users;
CREATE TRIGGER trg_sync_user_registration_channel
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_registration_channel();

-- 4. 既存ユーザーのバックフィル
INSERT INTO public.user_registration_channels (
  id, provider, line_official_account_friend, created_at
)
SELECT
  id,
  raw_user_meta_data ->> 'provider',
  (raw_user_meta_data ->> 'line_official_account_friend')::boolean,
  COALESCE(created_at, now())
FROM auth.users
ON CONFLICT (id) DO UPDATE
  SET provider = EXCLUDED.provider,
      line_official_account_friend = EXCLUDED.line_official_account_friend,
      updated_at = now();

-- 5. bq_user への SELECT（public のデフォルト権限で付与されるはずだが冪等に明示）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bq_user') THEN
    GRANT SELECT ON public.user_registration_channels TO bq_user;
  END IF;
END $$;

-- 検証クエリ（手動実行用・コメントアウト）:
/*
SELECT
  (SELECT COUNT(*) FROM auth.users)                          AS auth_users,
  (SELECT COUNT(*) FROM public.user_registration_channels)   AS mirrored;

SELECT has_table_privilege('bq_user', 'public.user_registration_channels', 'SELECT');

SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'bq_pub' AND tablename = 'user_registration_channels';
*/
