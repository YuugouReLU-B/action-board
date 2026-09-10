import {
  hexToHslTriplet,
  hslTripletToHex,
  parseHex,
  parseHslTriplet,
  parseRgbFunction,
  toPickerHex,
} from "./color-format";

describe("parseHex", () => {
  it("6桁のhexをRGBに変換する", () => {
    expect(parseHex("#30baa7")).toEqual({ r: 0x30, g: 0xba, b: 0xa7 });
  });

  it("3桁のhexを展開する", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("# なしでも受け付ける", () => {
    expect(parseHex("30baa7")).toEqual({ r: 0x30, g: 0xba, b: 0xa7 });
  });

  it("大文字を受け付ける", () => {
    expect(parseHex("#30BAA7")).toEqual({ r: 0x30, g: 0xba, b: 0xa7 });
  });

  it("前後の空白を無視する", () => {
    expect(parseHex("  #30baa7 ")).toEqual({ r: 0x30, g: 0xba, b: 0xa7 });
  });

  it.each([
    "",
    "#12",
    "#12345",
    "#gggggg",
    "rgb(1,2,3)",
    "var(--x)",
  ])("不正な入力 %s は null", (value) => {
    expect(parseHex(value)).toBeNull();
  });
});

describe("parseHslTriplet", () => {
  it("HSLトリプレットをパースする", () => {
    expect(parseHslTriplet("168 59% 41%")).toEqual({ h: 168, s: 59, l: 41 });
  });

  it("小数を受け付ける", () => {
    expect(parseHslTriplet("0 62.8% 30.6%")).toEqual({
      h: 0,
      s: 62.8,
      l: 30.6,
    });
  });

  it.each([
    "168 59 41",
    "168, 59%, 41%",
    "#30baa7",
    "",
  ])("不正な入力 %s は null", (value) => {
    expect(parseHslTriplet(value)).toBeNull();
  });
});

describe("hslTripletToHex", () => {
  it("彩度0はグレーになる", () => {
    expect(hslTripletToHex("0 0% 100%")).toBe("#ffffff");
    expect(hslTripletToHex("0 0% 0%")).toBe("#000000");
    expect(hslTripletToHex("0 0% 50%")).toBe("#808080");
  });

  it("原色を変換する", () => {
    expect(hslTripletToHex("0 100% 50%")).toBe("#ff0000");
    expect(hslTripletToHex("120 100% 50%")).toBe("#00ff00");
    expect(hslTripletToHex("240 100% 50%")).toBe("#0000ff");
  });

  it("色相が360を超えても正規化する", () => {
    expect(hslTripletToHex("360 100% 50%")).toBe("#ff0000");
    expect(hslTripletToHex("480 100% 50%")).toBe("#00ff00");
  });

  it("不正な入力は null", () => {
    expect(hslTripletToHex("#30baa7")).toBeNull();
  });
});

describe("hexToHslTriplet", () => {
  it("グレーは彩度0になる", () => {
    expect(hexToHslTriplet("#ffffff")).toBe("0 0% 100%");
    expect(hexToHslTriplet("#000000")).toBe("0 0% 0%");
  });

  it("原色を変換する", () => {
    expect(hexToHslTriplet("#ff0000")).toBe("0 100% 50%");
    expect(hexToHslTriplet("#00ff00")).toBe("120 100% 50%");
    expect(hexToHslTriplet("#0000ff")).toBe("240 100% 50%");
  });

  it("不正な入力は null", () => {
    expect(hexToHslTriplet("168 59% 41%")).toBeNull();
  });
});

describe("hex と HSL の往復", () => {
  it.each([
    "#30baa7",
    "#64d8c6",
    "#08306b",
    "#f7fbff",
    "#ef4444",
  ])("%s は往復してもほぼ同じ色になる", (value) => {
    const triplet = hexToHslTriplet(value);
    expect(triplet).not.toBeNull();

    const roundTripped = hslTripletToHex(triplet as string);
    const original = parseHex(value);
    const result = parseHex(roundTripped as string);

    // 丸め誤差を許容する（各チャンネル ±2）
    expect(Math.abs((result?.r ?? 0) - (original?.r ?? 0))).toBeLessThanOrEqual(
      2,
    );
    expect(Math.abs((result?.g ?? 0) - (original?.g ?? 0))).toBeLessThanOrEqual(
      2,
    );
    expect(Math.abs((result?.b ?? 0) - (original?.b ?? 0))).toBeLessThanOrEqual(
      2,
    );
  });
});

describe("parseRgbFunction", () => {
  it("スペース区切りの rgb() をパースする", () => {
    expect(parseRgbFunction("rgb(48 186 167)")).toEqual({
      r: 48,
      g: 186,
      b: 167,
    });
  });

  it("カンマ区切りの rgb() をパースする", () => {
    expect(parseRgbFunction("rgb(48, 186, 167)")).toEqual({
      r: 48,
      g: 186,
      b: 167,
    });
  });

  it("アルファ付きも受け付ける", () => {
    expect(parseRgbFunction("rgba(48, 186, 167, 0.5)")).toEqual({
      r: 48,
      g: 186,
      b: 167,
    });
    expect(parseRgbFunction("rgb(48 186 167 / 50%)")).toEqual({
      r: 48,
      g: 186,
      b: 167,
    });
  });

  it.each([
    "#30baa7",
    "lab(66% -58 19)",
    "",
  ])("不正な入力 %s は null", (value) => {
    expect(parseRgbFunction(value)).toBeNull();
  });
});

describe("toPickerHex", () => {
  it("hexはそのまま正規化する", () => {
    expect(toPickerHex("#30BAA7")).toBe("#30baa7");
    expect(toPickerHex("#fff")).toBe("#ffffff");
  });

  it("HSLトリプレットをhexに変換する", () => {
    expect(toPickerHex("0 0% 100%")).toBe("#ffffff");
  });

  it("rgb() をhexに変換する", () => {
    expect(toPickerHex("rgb(48, 186, 167)")).toBe("#30baa7");
  });

  it.each([
    "",
    "   ",
    "lab(66.9756% -58.27 19.5419)",
    "oklch(0.7 0.1 180)",
  ])("変換できない形式 %s は null", (value) => {
    expect(toPickerHex(value)).toBeNull();
  });
});
