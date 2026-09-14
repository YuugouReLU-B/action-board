-- 全ユーザーに admin ロールを付与する（浜通りクエスト運用開始前の暫定措置）
--
-- 管理画面 /admin は auth.users.raw_app_meta_data.roles に "admin" が
-- 入っているかだけで判定している（public.is_admin() / lib/utils/admin.ts）。
-- 運用開始前の関係者しかいない段階では全員が管理者で構わない、という判断。
--
-- ⚠️ 一般ユーザーが増えるフェーズに入ったらこのマイグレーションの効果を
--    打ち消すマイグレーションを追加し、トリガーを落とすこと。

-- 1) 既存ユーザーへの付与
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{roles}',
      CASE
        WHEN jsonb_typeof(raw_app_meta_data -> 'roles') = 'array'
          THEN (raw_app_meta_data -> 'roles') || '["admin"]'::jsonb
        ELSE '["admin"]'::jsonb
      END
    )
-- roles が NULL のときは比較結果も NULL になるので COALESCE で潰す
WHERE NOT COALESCE(
  jsonb_typeof(raw_app_meta_data -> 'roles') = 'array'
  AND (raw_app_meta_data -> 'roles') ? 'admin',
  false
);

-- 2) 以降の新規登録・ログイン時にも付与する
--    BEFORE トリガーで NEW を書き換えるだけなので再帰しない。
--    ログイン時は GoTrue が last_sign_in_at を UPDATE するのでそこで拾える。
CREATE OR REPLACE FUNCTION public.grant_admin_role_to_all_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
  roles jsonb := CASE
    WHEN jsonb_typeof(meta -> 'roles') = 'array' THEN meta -> 'roles'
    ELSE '[]'::jsonb
  END;
BEGIN
  IF NOT (roles ? 'admin') THEN
    NEW.raw_app_meta_data := jsonb_set(meta, '{roles}', roles || '["admin"]'::jsonb);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_admin_role_to_all_users ON auth.users;
CREATE TRIGGER grant_admin_role_to_all_users
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_admin_role_to_all_users();
