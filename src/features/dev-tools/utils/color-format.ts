/**
 * `/dev` のカラーピッカー用の色変換。
 *
 * `<input type="color">` は `#rrggbb` しか扱えないが、shadcn/ui のトークンは
 * `168 59% 41%` という HSL トリプレット（`hsl(var(--x))` で使う形）なので
 * 双方向に変換する必要がある。
 */

/** `#rgb` / `#rrggbb` を 0-255 の RGB に変換する。不正な入力は null */
export function parseHex(
  value: string,
): { r: number; g: number; b: number } | null {
  const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;

  const digits = match[1];
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((char) => char + char)
          .join("")
      : digits;

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function toHexPair(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");
}

/** `168 59% 41%` 形式の HSL トリプレットをパースする。不正な入力は null */
export function parseHslTriplet(
  value: string,
): { h: number; s: number; l: number } | null {
  const match = value
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;

  return {
    h: Number.parseFloat(match[1]),
    s: Number.parseFloat(match[2]),
    l: Number.parseFloat(match[3]),
  };
}

/** HSL トリプレット文字列を `#rrggbb` に変換する */
export function hslTripletToHex(value: string): string | null {
  const parsed = parseHslTriplet(value);
  if (!parsed) return null;

  const h = ((parsed.h % 360) + 360) % 360;
  const s = parsed.s / 100;
  const l = parsed.l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  const [r1, g1, b1] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return `#${toHexPair((r1 + m) * 255)}${toHexPair((g1 + m) * 255)}${toHexPair(
    (b1 + m) * 255,
  )}`;
}

/** `#rrggbb` を `168 59% 41%` 形式の HSL トリプレットに変換する */
export function hexToHslTriplet(value: string): string | null {
  const rgb = parseHex(value);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** `rgb(1 2 3)` / `rgba(1, 2, 3, 0.5)` をパースする。不正な入力は null */
export function parseRgbFunction(
  value: string,
): { r: number; g: number; b: number } | null {
  const match = value
    .trim()
    .match(
      /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)\s*(?:[,/].*)?\)$/i,
    );
  if (!match) return null;

  return {
    r: Number.parseFloat(match[1]),
    g: Number.parseFloat(match[2]),
    b: Number.parseFloat(match[3]),
  };
}

/**
 * CSS の色表現をカラーピッカーが扱える `#rrggbb` に正規化する。
 *
 * hex / HSL トリプレット / `rgb()` に対応する。
 * `lab()` や `oklch()` は解釈できないため null を返す
 * （Tailwind v4 は同じ変数を hex と lab() で二重定義しており、
 * getComputedStyle が後勝ちの lab() を返すことがある。
 * 呼び出し側でブラウザに解決させてから渡すこと）。
 */
export function toPickerHex(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const asHex = parseHex(trimmed);
  if (asHex) {
    return `#${toHexPair(asHex.r)}${toHexPair(asHex.g)}${toHexPair(asHex.b)}`;
  }

  const asRgb = parseRgbFunction(trimmed);
  if (asRgb) {
    return `#${toHexPair(asRgb.r)}${toHexPair(asRgb.g)}${toHexPair(asRgb.b)}`;
  }

  return hslTripletToHex(trimmed);
}
