-- 累計1000pt到達ユーザーをLINE公式アカウントのオーディエンスに追加済みかどうかを記録する。
-- シーズンごとの user_levels 行に紐づけることで、シーズンが変わると自動的に未追加へ戻る。
alter table public.user_levels
  add column line_1000pt_audience_added_at timestamptz;
