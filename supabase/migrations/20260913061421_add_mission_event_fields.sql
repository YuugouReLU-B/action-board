-- ミッション編集フォームの項目整理に伴うカラム追加
-- event_type: イベント種別。アイコンの自動選択に使う（値の妥当性はアプリ層のzodで検証）
-- tag1/2/3: 管理画面で自由入力できるタグ
-- event_end_date: 特設クエストの終了日。既存の event_date を開始日として扱う
-- supplement: 補足事項。既存の artifact_label（提出物のラベル）とは別の自由記述欄
alter table missions
  add column event_type text,
  add column tag1 text,
  add column tag2 text,
  add column tag3 text,
  add column event_end_date date,
  add column supplement text;

comment on column missions.event_type is 'イベント種別。アイコンの自動選択に使う（祭り/マルシェ/教室・ワークショップ/ツアー/講演・交流会/大会・スポーツ/その他）';
comment on column missions.tag1 is '管理画面で自由入力するタグ1';
comment on column missions.tag2 is '管理画面で自由入力するタグ2';
comment on column missions.tag3 is '管理画面で自由入力するタグ3';
comment on column missions.event_end_date is '特設クエストの終了日。event_date を開始日として扱う';
comment on column missions.supplement is '補足事項。artifact_label（提出物のラベル）とは別の自由記述欄';
