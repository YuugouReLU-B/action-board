import { MapIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SPOT_MAP_PATH } from "@/features/spot-map/constants/spot-map-path";
import { getMapSpots } from "@/features/spot-map/services/spot-map";

/**
 * トップページに置くスポットマップの入口。
 *
 * 地図に出せるスポット（緯度経度が入っているQRスポット）が
 * 1件も無いときは何も出さない。空の地図へ誘導しても意味がない。
 */
export async function SpotMapEntry({ userId }: { userId?: string }) {
  const spots = await getMapSpots(userId ?? null);
  if (spots.length === 0) return null;

  const remaining = spots.filter((spot) => !spot.achieved).length;

  return (
    <section className="w-full md:container md:mx-auto px-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-6 text-center sm:flex-row sm:text-left">
        <MapIcon
          className="h-10 w-10 shrink-0 text-gray-700"
          aria-hidden="true"
        />
        <div className="flex-1">
          <h2 className="text-lg font-bold">スポットマップ</h2>
          <p className="mt-1 text-sm text-gray-600">
            {userId
              ? `まだ回っていないスポットが ${remaining} か所あります。地図で場所を確かめて、現地のQRコードを読み取ろう。`
              : `${spots.length} か所のチェックポイントを地図で探せます。`}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={SPOT_MAP_PATH}>地図で見る</Link>
        </Button>
      </div>
    </section>
  );
}
