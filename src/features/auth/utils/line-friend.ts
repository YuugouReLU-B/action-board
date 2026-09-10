/**
 * ユーザーメタデータに公式LINEの友だち状態を保存するキー。
 *
 * LINEログイン時に `/friendship/v1/status` の friendFlag を見て書き込む。
 * 判定できなかった場合はキー自体を書かない（未判定と「友だちでない」を区別せず、
 * 既存の true を false で上書きしないため）。
 *
 * 書き込み側と読み出し側で文字列が散らばると片方だけ直して壊れるので、
 * ここを唯一の定義とする。
 */
export const LINE_FRIEND_METADATA_KEY = "line_official_account_friend";
