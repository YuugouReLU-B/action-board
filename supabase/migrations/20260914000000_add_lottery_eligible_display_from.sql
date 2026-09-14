ALTER TABLE public.lottery_settings
  ADD COLUMN eligible_display_from DATE;

COMMENT ON COLUMN public.lottery_settings.eligible_display_from IS
  '応募トークンとボタンの表示開始日（日本時間の0時から）。NULLなら日付条件なし。ポイント条件と併用する。';
