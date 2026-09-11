import {
  diffCategoryIds,
  nextSortNo,
} from "@/features/admin/utils/category-links";

describe("diffCategoryIds", () => {
  it("追加されたカテゴリだけを toAdd に入れる", () => {
    expect(diffCategoryIds(["a"], ["a", "b"])).toEqual({
      toAdd: ["b"],
      toRemove: [],
    });
  });

  it("外されたカテゴリだけを toRemove に入れる", () => {
    expect(diffCategoryIds(["a", "b"], ["a"])).toEqual({
      toAdd: [],
      toRemove: ["b"],
    });
  });

  it("入れ替えを追加と削除の両方として返す", () => {
    expect(diffCategoryIds(["a"], ["b"])).toEqual({
      toAdd: ["b"],
      toRemove: ["a"],
    });
  });

  it("変更がなければどちらも空にする", () => {
    expect(diffCategoryIds(["a", "b"], ["b", "a"])).toEqual({
      toAdd: [],
      toRemove: [],
    });
  });

  it("全部外した場合はすべて削除になる", () => {
    expect(diffCategoryIds(["a", "b"], [])).toEqual({
      toAdd: [],
      toRemove: ["a", "b"],
    });
  });

  it("重複して選ばれても一度しか追加しない", () => {
    expect(diffCategoryIds([], ["a", "a"])).toEqual({
      toAdd: ["a"],
      toRemove: [],
    });
  });
});

describe("nextSortNo", () => {
  it("カテゴリが空なら先頭に置く", () => {
    expect(nextSortNo([])).toBe(0);
  });

  it("既存の最大値の次に置く", () => {
    expect(nextSortNo([0, 10, 20])).toBe(30);
  });

  it("並びが昇順でなくても最大値を見る", () => {
    expect(nextSortNo([30, 0, 10])).toBe(40);
  });
});
