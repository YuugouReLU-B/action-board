-- 20260914010000 で追加した「全ユーザーに自動でadminを付与するトリガー」を止める。
-- 運用開始前の暫定措置として導入したが、一般ユーザーが増えるフェーズに
-- 入ったため、今後のログイン・新規登録では admin を自動付与しない。
--
-- 既に admin ロールが付与済みのユーザーからは剥奪しない（このマイグレーションは
-- 新規付与を止めるだけ）。

DROP TRIGGER IF EXISTS grant_admin_role_to_all_users ON auth.users;
DROP FUNCTION IF EXISTS public.grant_admin_role_to_all_users();
