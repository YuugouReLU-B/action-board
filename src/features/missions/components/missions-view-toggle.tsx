"use client";

import { List, Map as MapIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { MissionsMapView } from "@/features/missions/components/missions-map-view";
import type { MapSpot } from "@/features/spot-map/services/spot-map";

type MissionsViewToggleProps = {
  /** 一覧モードの中身（サーバーでレンダリング済みのカテゴリ別カード一覧） */
  children: ReactNode;
  /** 地図モードで表示する、座標を持つミッションの一覧 */
  mapSpots: MapSpot[];
};

export function MissionsViewToggle({
  children,
  mapSpots,
}: MissionsViewToggleProps) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-3">
        <h2 className="text-center text-2xl md:text-3xl my-5">🎯 ミッション</h2>
        {mapSpots.length > 0 && (
          <div className="inline-flex rounded-full border border-gray-300 p-1">
            <Button
              type="button"
              size="sm"
              variant={view === "list" ? "default" : "ghost"}
              className="rounded-full px-4"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
            >
              <List className="mr-1 h-4 w-4" aria-hidden="true" />
              一覧で見る
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "map" ? "default" : "ghost"}
              className="rounded-full px-4"
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
            >
              <MapIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              地図で見る
            </Button>
          </div>
        )}
      </div>

      {view === "list" ? (
        children
      ) : (
        <div className="w-full md:container md:mx-auto px-4">
          <MissionsMapView spots={mapSpots} />
        </div>
      )}
    </div>
  );
}
