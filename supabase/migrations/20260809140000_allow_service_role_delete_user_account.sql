-- delete_user_account を service_role からも呼べるようにする
--
-- 開発用のユーザー削除ツール（/dev/users）で、任意のユーザーを
-- 本番と同じ削除順序で消せるようにするための変更。
-- 削除対象テーブルの一覧をアプリ側に複製すると、
-- テーブルが増えたときに片方だけ取りこぼす事故が起きるため、
-- 既存の関数をそのまま再利用する。
--
-- service_role は元から RLS を回避して各テーブルを直接 DELETE できるので、
-- この緩和で新たに与えている権限はない。

CREATE OR REPLACE FUNCTION delete_user_account(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- 認証チェック：自分のアカウントのみ削除可能。
  -- ただし service_role（サーバー側の管理クライアント）からの呼び出しは許可する。
  -- service_role は RLS を回避して直接 DELETE できる権限を元から持っており、
  -- ここで許可しても新たな権限を与えることにはならない。
  -- 開発用のユーザー削除ツール（/dev/users）が削除順序を二重管理しないために必要。
  -- SECURITY DEFINER 内では current_user が関数所有者になってしまうため、
  -- 呼び出し元のロールは JWT クレームから判定する
  IF current_user_id IS NULL
     AND coalesce(
           current_setting('request.jwt.claims', true)::json ->> 'role',
           ''
         ) <> 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  IF current_user_id IS NOT NULL AND current_user_id != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own account';
  END IF;
  
  -- トランザクション開始（関数内で自動的に開始される）
  
  -- 外部キー制約を考慮した削除順序
  -- 1. mission_artifacts テーブル（user_id参照）
  DELETE FROM mission_artifacts WHERE user_id = target_user_id;
  
  -- 2. poster_activities テーブル（user_id参照）
  DELETE FROM poster_activities WHERE user_id = target_user_id;
  
  -- 3. poster_board_status_history テーブル（user_id参照）
  DELETE FROM poster_board_status_history WHERE user_id = target_user_id;
  
  -- 4. user_badges テーブル（user_id参照）
  DELETE FROM user_badges WHERE user_id = target_user_id;
  
  -- 5. achievements テーブル（user_id参照）
  DELETE FROM achievements WHERE user_id = target_user_id;
  
  -- 6. xp_transactions テーブル（user_id参照）
  DELETE FROM xp_transactions WHERE user_id = target_user_id;
  
  -- 7. user_levels テーブル（user_id参照）
  DELETE FROM user_levels WHERE user_id = target_user_id;
  
  -- 8. user_referral テーブル（user_id参照）
  DELETE FROM user_referral WHERE user_id = target_user_id;
  
  -- 9. user_activities テーブル（user_id参照）
  DELETE FROM user_activities WHERE user_id = target_user_id;
  
  -- 10. public_user_profiles テーブル（id参照）
  DELETE FROM public_user_profiles WHERE id = target_user_id;
  
  -- 11. private_users テーブル（id参照、メインテーブル）
  DELETE FROM private_users WHERE id = target_user_id;
  
  -- 成功した場合、トランザクションがコミットされる
  -- エラーが発生した場合、自動的にロールバックされる
  
EXCEPTION
  WHEN OTHERS THEN
    -- エラーログ出力
    RAISE LOG 'Error deleting user account %: %', target_user_id, SQLERRM;
    -- エラーを再スロー（ロールバックを発生させる）
    RAISE;
END;
$$;

-- セキュリティ設定：認証されたユーザーのみ実行可能

GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO service_role;
