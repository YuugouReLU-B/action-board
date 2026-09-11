"use client";

import { useState } from "react";
import {
  type ImageAssetStatus,
  STATUS_LABEL,
} from "@/features/dev-tools/constants/image-assets";
import type { ImageAsset } from "@/features/dev-tools/services/image-assets";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ImageAssetStatus, string> = {
  replace: "bg-red-100 text-red-800",
  recolor: "bg-amber-100 text-amber-800",
  keep: "bg-gray-100 text-gray-700",
  undecided: "bg-blue-100 text-blue-800",
};

/** 透過・白抜きの素材は下地を変えないと見えない */
const BACKDROPS = [
  { key: "checker", label: "市松" },
  { key: "light", label: "白" },
  { key: "dark", label: "黒" },
] as const;

type BackdropKey = (typeof BACKDROPS)[number]["key"];

const BACKDROP_STYLE: Record<BackdropKey, React.CSSProperties> = {
  checker: {
    backgroundColor: "#ffffff",
    backgroundImage:
      "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
  },
  light: { backgroundColor: "#ffffff" },
  dark: { backgroundColor: "#1f2937" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ImageAssetGrid({ assets }: { assets: ImageAsset[] }) {
  const [backdrop, setBackdrop] = useState<BackdropKey>("checker");

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-600">背景</span>
        {BACKDROPS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setBackdrop(key)}
            aria-pressed={backdrop === key}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              backdrop === key
                ? "border-gray-800 bg-gray-800 font-bold text-white"
                : "border-gray-300 text-gray-600 hover:border-gray-400",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {assets.map((asset) => (
          <li
            key={asset.path}
            className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <div
              className="flex h-32 items-center justify-center p-2"
              style={BACKDROP_STYLE[backdrop]}
            >
              {/* 開発ツールで実ファイルをそのまま確認したいので next/image の最適化は通さない */}
              {/** biome-ignore lint/performance/noImgElement: 素材の原寸を確認するため */}
              <img
                src={asset.path}
                alt={asset.label}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex flex-1 flex-col gap-1.5 border-t border-gray-200 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold leading-tight">
                  {asset.label}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    STATUS_STYLE[asset.status],
                  )}
                >
                  {STATUS_LABEL[asset.status]}
                </span>
              </div>

              <code className="break-all text-[11px] text-gray-500">
                {asset.path}
              </code>

              <p className="text-[11px] text-gray-500">
                {asset.dimensions
                  ? `${asset.dimensions.width}×${asset.dimensions.height}`
                  : "寸法不明"}
                {" ・ "}
                {formatBytes(asset.bytes)}
              </p>

              {asset.usedIn.length > 0 && (
                <div className="mt-0.5">
                  <p className="text-[11px] font-bold text-gray-600">
                    使用箇所
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-gray-600">
                    {/* 同名のミッションが複数あり得るので、名前はキーにできない */}
                    {asset.usedIn.slice(0, 4).map((place, index) => (
                      <li key={`${asset.path}-${index}`}>{place}</li>
                    ))}
                    {asset.usedIn.length > 4 && (
                      <li className="list-none text-gray-400">
                        ほか {asset.usedIn.length - 4} 件
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {asset.note && (
                <p className="mt-auto pt-1 text-[11px] leading-snug text-gray-700">
                  {asset.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
