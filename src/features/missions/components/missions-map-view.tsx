"use client";

import { useMemo } from "react";
import { SpotList } from "@/features/spot-map/components/spot-list";
import { SpotMapLoader } from "@/features/spot-map/components/spot-map-loader";
import type { MapSpot } from "@/features/spot-map/services/spot-map";
import { useCurrentLocation } from "@/lib/hooks/use-current-location";
import { calculateDistanceMeters } from "@/lib/utils/geo-distance";

type MissionsMapViewProps = {
  spots: MapSpot[];
};

/**
 * ミッション一覧の地図モード。
 *
 * 地図そのものは座標順（データの並び順）でピンを打つだけ。
 * 下の一覧だけ、現在地が取れ次第「近い順」に並べ替える。
 */
export function MissionsMapView({ spots }: MissionsMapViewProps) {
  // 地図インスタンスに紐付けない使い方（現在地の取得だけ利用する）
  const { currentPos } = useCurrentLocation(null);

  const sortedSpots = useMemo(() => {
    if (!currentPos) return spots;
    const [lat, lng] = currentPos;
    return [...spots].sort(
      (a, b) =>
        calculateDistanceMeters(lat, lng, a.latitude, a.longitude) -
        calculateDistanceMeters(lat, lng, b.latitude, b.longitude),
    );
  }, [spots, currentPos]);

  return (
    <div className="space-y-4">
      <SpotMapLoader spots={spots} />
      <div>
        <p className="mb-2 text-sm text-gray-600">
          {currentPos
            ? "現在地から近い順に並んでいます"
            : "位置情報を許可すると、近い順に並び替わります"}
        </p>
        <SpotList spots={sortedSpots} />
      </div>
    </div>
  );
}
