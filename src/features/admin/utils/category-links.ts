/**
 * ミッションとカテゴリの紐付けを差分で更新するための計算。
 *
 * DBに触らない純粋な関数だけを置く。紐付けはトップページの表示を
 * 左右する（どのカテゴリにも入っていないミッションは一覧に出ない）ので、
 * 差分の取り違えが起きないようここでテストできるようにしている。
 */

export type CategoryLinkDiff = {
  toAdd: string[];
  toRemove: string[];
};

/** 現在の紐付けと、フォームで選ばれた紐付けの差分を出す */
export function diffCategoryIds(
  current: readonly string[],
  next: readonly string[],
): CategoryLinkDiff {
  const currentSet = new Set(current);
  const nextSet = new Set(next);

  return {
    toAdd: Array.from(nextSet).filter((id) => !currentSet.has(id)),
    toRemove: Array.from(currentSet).filter((id) => !nextSet.has(id)),
  };
}

/**
 * カテゴリ内での並び順を決める。既存の最大値の次に置く。
 *
 * 途中に割り込ませる編集はまだ用意していない。新しく足したものが
 * カテゴリの末尾に並べば運用上は足りる。
 */
export function nextSortNo(
  existingSortNos: readonly number[],
  step = 10,
): number {
  if (existingSortNos.length === 0) return 0;
  return Math.max(...existingSortNos) + step;
}
