"use client";

import dynamic from "next/dynamic";
import type { MapSpot } from "@/features/spot-map/services/spot-map";

/**
 * 地図はブラウザでしか動かない（Leaflet が window を触る）ので、
 * サーバーでは描かずクライアントで読み込む。
 *
 * Server Component からは `ssr: false` を指定できないため、
 * この薄いクライアント側の入れ物を挟んでいる。
 */
const SpotMap = dynamic(
  () => import("@/features/spot-map/components/spot-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[65vh] min-h-[320px] w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
        地図を読み込んでいます...
      </div>
    ),
  },
);

export function SpotMapLoader({ spots }: { spots: MapSpot[] }) {
  return <SpotMap spots={spots} />;
}
