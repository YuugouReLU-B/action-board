"use client";

import { Calendar as CalendarIcon, List, Map as MapIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MissionsCalendarView } from "@/features/missions/components/missions-calendar-view";
import { MissionsMapView } from "@/features/missions/components/missions-map-view";
import { MissionsTagFilter } from "@/features/missions/components/missions-tag-filter";
import type { TaggedMission } from "@/features/missions/components/missions-tags";

type ViewMode = "list" | "map" | "calendar";

type MissionsViewToggleProps = {
  /** 一覧モード（タグ絞り込み）で表示する全ミッション */
  listMissions: TaggedMission[];
  /** 地図モードで表示する、座標を持つミッションの一覧 */
  mapMissions: TaggedMission[];
  /** カレンダーモードで表示する、開催日を持つ特設クエストの一覧 */
  calendarMissions: TaggedMission[];
};

export function MissionsViewToggle({
  listMissions,
  mapMissions,
  calendarMissions,
}: MissionsViewToggleProps) {
  const [view, setView] = useState<ViewMode>("list");
  const showToggle = mapMissions.length > 0 || calendarMissions.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold my-5">
          クエスト
        </h2>
        {showToggle && (
          <div className="flex justify-end px-4 md:px-10">
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
                一覧
              </Button>
              {mapMissions.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant={view === "map" ? "default" : "ghost"}
                  className="rounded-full px-4"
                  onClick={() => setView("map")}
                  aria-pressed={view === "map"}
                >
                  <MapIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                  地図
                </Button>
              )}
              {calendarMissions.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant={view === "calendar" ? "default" : "ghost"}
                  className="rounded-full px-4"
                  onClick={() => setView("calendar")}
                  aria-pressed={view === "calendar"}
                >
                  <CalendarIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                  カレンダー
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {view === "list" && <MissionsTagFilter missions={listMissions} />}

      {view === "map" && (
        <div className="w-full md:container md:mx-auto px-4">
          <MissionsMapView missions={mapMissions} />
        </div>
      )}

      {view === "calendar" && (
        <div className="w-full md:container md:mx-auto px-4">
          <MissionsCalendarView missions={calendarMissions} />
        </div>
      )}
    </div>
  );
}
