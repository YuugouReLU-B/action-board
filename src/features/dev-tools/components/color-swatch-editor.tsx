"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APP_COLOR_TOKEN_GROUPS,
  type ColorToken,
  type ColorTokenGroup,
  listTailwindPaletteVars,
  SEMANTIC_TOKEN_GROUP,
  USED_TAILWIND_PALETTE,
} from "@/lib/design/color-tokens";
import { cn } from "@/lib/utils";
import { COLOR_PRESETS, type ColorPreset } from "../constants/color-presets";
import {
  DEV_COLOR_OVERRIDES_STORAGE_KEY,
  DEV_COLOR_PRESET_STORAGE_KEY,
} from "../constants/storage";
import { hexToHslTriplet, toPickerHex } from "../utils/color-format";

type Overrides = Record<string, string>;

/**
 * ブラウザに任意の CSS 色を解決させて `#rrggbb` を得る。
 *
 * Tailwind v4 は `--color-emerald-100` を hex と `lab()` で二重定義しており、
 * getComputedStyle が後勝ちの `lab()` を返す。文字列パースでは扱えないため、
 * 一度 DOM に色として適用して `rgb()` に落としてもらう。
 */
function resolveWithBrowser(value: string): string | null {
  const direct = toPickerHex(value);
  if (direct) return direct;

  const probe = document.createElement("span");
  probe.style.display = "none";
  probe.style.color = value;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  return toPickerHex(computed);
}

function readCurrentValue(cssVar: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
}

/** Tailwind パレットを疑似的なグループとして扱う */
function buildTailwindGroups(): ColorTokenGroup[] {
  return Object.entries(USED_TAILWIND_PALETTE).map(([family, shades]) => ({
    id: `tailwind-${family}`,
    label: family,
    description: "",
    tokens: shades.map<ColorToken>((shade) => ({
      cssVar: `--color-${family}-${shade}`,
      label: `${family}-${shade}`,
      defaultValue: "",
      format: "hex",
    })),
  }));
}

interface TokenRowProps {
  token: ColorToken;
  override?: string;
  currentHex: string;
  onChange: (cssVar: string, hex: string) => void;
  onReset: (cssVar: string) => void;
}

function TokenRow({
  token,
  override,
  currentHex,
  onChange,
  onReset,
}: TokenRowProps) {
  const isOverridden = override !== undefined;

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50">
      <input
        type="color"
        // 表示名は重複しうる（例: セマンティックの --primary とブランドの
        // --app-brand-primary が共に「プライマリ」）ため変数名まで含める
        aria-label={`${token.label} (${token.cssVar}) の色`}
        data-css-var={token.cssVar}
        value={currentHex}
        disabled={token.locked}
        onChange={(event) => onChange(token.cssVar, event.target.value)}
        className="h-8 w-10 shrink-0 cursor-pointer rounded border border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{token.label}</span>
          {token.locked && (
            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-700">
              変更不可
            </span>
          )}
          {isOverridden && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800">
              変更中
            </span>
          )}
        </div>
        <div className="truncate font-mono text-xs text-gray-500">
          {token.cssVar}
          {token.note ? ` — ${token.note}` : ""}
        </div>
      </div>

      <code className="shrink-0 font-mono text-xs text-gray-600">
        {currentHex}
      </code>

      <button
        type="button"
        onClick={() => onReset(token.cssVar)}
        disabled={!isOverridden}
        className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        戻す
      </button>
    </div>
  );
}

export function ColorSwatchEditor() {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [currentHexes, setCurrentHexes] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);
  const [showTailwind, setShowTailwind] = useState(false);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);

  const tailwindGroups = useMemo(buildTailwindGroups, []);

  const allGroups = useMemo(
    () => [SEMANTIC_TOKEN_GROUP, ...APP_COLOR_TOKEN_GROUPS],
    [],
  );

  const allVars = useMemo(
    () => [
      ...allGroups.flatMap((group) =>
        group.tokens.map((token) => token.cssVar),
      ),
      ...listTailwindPaletteVars(),
    ],
    [allGroups],
  );

  /** 現在の実効値を読み直してピッカー用の hex に整える */
  const refreshCurrentHexes = useCallback(() => {
    const next: Record<string, string> = {};
    for (const cssVar of allVars) {
      const resolved = resolveWithBrowser(readCurrentValue(cssVar));
      if (resolved) next[cssVar] = resolved;
    }
    setCurrentHexes(next);
  }, [allVars]);

  // 保存済みの上書きを復元して適用する
  useEffect(() => {
    let stored: Overrides = {};
    try {
      stored = JSON.parse(
        localStorage.getItem(DEV_COLOR_OVERRIDES_STORAGE_KEY) ?? "{}",
      );
    } catch {
      stored = {};
    }

    for (const [cssVar, value] of Object.entries(stored)) {
      document.documentElement.style.setProperty(cssVar, value);
    }

    setOverrides(stored);
    setAppliedPresetId(localStorage.getItem(DEV_COLOR_PRESET_STORAGE_KEY));
    refreshCurrentHexes();
    setIsReady(true);
  }, [refreshCurrentHexes]);

  const persist = useCallback((next: Overrides) => {
    setOverrides(next);
    localStorage.setItem(DEV_COLOR_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const handleChange = useCallback(
    (cssVar: string, hex: string) => {
      // shadcn のトークンは `hsl(var(--x))` で使われるためトリプレットで書き戻す
      const isSemantic = SEMANTIC_TOKEN_GROUP.tokens.some(
        (token) => token.cssVar === cssVar,
      );
      const value = isSemantic ? (hexToHslTriplet(hex) ?? hex) : hex;

      document.documentElement.style.setProperty(cssVar, value);
      setCurrentHexes((prev) => ({ ...prev, [cssVar]: hex }));
      persist({ ...overrides, [cssVar]: value });
      // 個別に触った時点でプリセットそのままではなくなる
      setAppliedPresetId(null);
      localStorage.removeItem(DEV_COLOR_PRESET_STORAGE_KEY);
    },
    [overrides, persist],
  );

  const handleReset = useCallback(
    (cssVar: string) => {
      document.documentElement.style.removeProperty(cssVar);

      const next = { ...overrides };
      delete next[cssVar];
      persist(next);
      setAppliedPresetId(null);
      localStorage.removeItem(DEV_COLOR_PRESET_STORAGE_KEY);

      const resolved = resolveWithBrowser(readCurrentValue(cssVar));
      if (resolved) {
        setCurrentHexes((prev) => ({ ...prev, [cssVar]: resolved }));
      }
    },
    [overrides, persist],
  );

  const handleResetAll = useCallback(() => {
    for (const cssVar of Object.keys(overrides)) {
      document.documentElement.style.removeProperty(cssVar);
    }
    persist({});
    setAppliedPresetId(null);
    localStorage.removeItem(DEV_COLOR_PRESET_STORAGE_KEY);
    refreshCurrentHexes();
  }, [overrides, persist, refreshCurrentHexes]);

  const handleApplyPreset = useCallback(
    (preset: ColorPreset) => {
      // 既存の上書きを一旦全て外してから当てる。
      // 前のプリセットの残りが混ざらないようにするため。
      for (const cssVar of Object.keys(overrides)) {
        document.documentElement.style.removeProperty(cssVar);
      }

      const next: Overrides = {};
      for (const [cssVar, hex] of Object.entries(preset.values)) {
        // プリセットは全て hex で持つので、トークンの形式に合わせて変換する
        const isSemantic = SEMANTIC_TOKEN_GROUP.tokens.some(
          (token) => token.cssVar === cssVar,
        );
        const value = isSemantic ? (hexToHslTriplet(hex) ?? hex) : hex;

        document.documentElement.style.setProperty(cssVar, value);
        next[cssVar] = value;
      }

      persist(next);
      setAppliedPresetId(preset.id);
      localStorage.setItem(DEV_COLOR_PRESET_STORAGE_KEY, preset.id);
      refreshCurrentHexes();
    },
    [overrides, persist, refreshCurrentHexes],
  );

  const overrideCount = Object.keys(overrides).length;

  if (!isReady) {
    return <p className="text-sm text-gray-500">読み込み中…</p>;
  }

  const renderGroup = (group: ColorTokenGroup) => (
    <section key={group.id} className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-bold">{group.label}</h3>
      {group.description && (
        <p className="mt-1 text-xs text-gray-600">{group.description}</p>
      )}
      <div className="mt-3 divide-y divide-gray-100">
        {group.tokens.map((token) => (
          <TokenRow
            key={token.cssVar}
            token={token}
            override={overrides[token.cssVar]}
            currentHex={currentHexes[token.cssVar] ?? "#000000"}
            onChange={handleChange}
            onReset={handleReset}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="text-sm text-amber-900">
          <p className="font-bold">
            変更はこのブラウザにのみ保存されます（localStorage）
          </p>
          <p className="mt-0.5">
            ファイルは書き換わりません。確定したい値は{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5">
              src/app/globals.css
            </code>{" "}
            に手で反映してください。現在 {overrideCount} 件変更中。
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetAll}
          disabled={overrideCount === 0}
          className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          すべて元に戻す
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold">プリセット</h3>
        <p className="mt-1 text-xs text-gray-600">
          ブランド色とセマンティックトークンを一括で差し替えます。地図のステータス色・都道府県ランキング配色・破壊的操作の赤は、色そのものが意味を持つため変わりません。
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {COLOR_PRESETS.map((preset) => {
            const isApplied = appliedPresetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                data-preset-id={preset.id}
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isApplied}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  isApplied
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{preset.label}</span>
                  {isApplied && (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                      適用中
                    </span>
                  )}
                </div>

                <div className="mt-2 flex gap-1">
                  {preset.swatches.map((swatch) => (
                    <span
                      key={swatch}
                      title={swatch}
                      style={{ backgroundColor: swatch }}
                      className="h-6 w-8 rounded border border-gray-300"
                    />
                  ))}
                </div>

                <p className="mt-2 text-xs text-gray-600">
                  {preset.description}
                </p>

                {preset.source && (
                  <p className="mt-1 text-xs text-gray-500">
                    出典: {preset.source.label}
                  </p>
                )}

                {preset.knownContrastIssues?.length ? (
                  <p className="mt-1 text-xs text-amber-700">
                    ⚠ コントラスト未達 {preset.knownContrastIssues.length} 件
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {allGroups.map(renderGroup)}

      <section className="rounded-lg border border-gray-200 p-4">
        <button
          type="button"
          onClick={() => setShowTailwind((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="text-sm font-bold">Tailwind パレット</span>
            <span className="ml-2 text-xs text-gray-600">
              コードで実際に使われている {listTailwindPaletteVars().length}{" "}
              色。text-gray-500 などのクラスがこれを参照する
            </span>
          </span>
          <span className="text-xs font-bold text-gray-500">
            {showTailwind ? "閉じる" : "開く"}
          </span>
        </button>

        {showTailwind && (
          <div className="mt-4 space-y-4">
            {tailwindGroups.map(renderGroup)}
          </div>
        )}
      </section>
    </div>
  );
}
