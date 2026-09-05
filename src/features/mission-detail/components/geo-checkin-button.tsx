"use client";

import { MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { geoCheckinAction } from "@/features/geo-checkin/actions/geo-checkin-actions";
import { googleMapsSearchUrl } from "@/lib/utils/map-links";

type GeoCheckinButtonProps = {
  missionId: string;
  latitude: number | null;
  longitude: number | null;
  onSuccess?: () => void;
};

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("この端末では位置情報が使えません"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  });
}

/**
 * 「イベントに来た」ボタン。
 *
 * 押した瞬間の位置情報を取得してサーバーへ送り、ミッションの座標から
 * 半径N m以内かどうかをサーバー側で判定する。判定そのものはブラウザで
 * 行わない（改ざんできてしまうため）。
 */
export function GeoCheckinButton({
  missionId,
  latitude,
  longitude,
  onSuccess,
}: GeoCheckinButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const hasLocation = latitude !== null && longitude !== null;

  const handleClick = () => {
    setMessage(null);
    startTransition(async () => {
      let position: GeolocationPosition;
      try {
        position = await getCurrentPosition();
      } catch {
        setMessage({
          tone: "error",
          text: "位置情報を取得できませんでした。端末の位置情報設定を確認してください。",
        });
        return;
      }

      const result = await geoCheckinAction(
        missionId,
        position.coords.latitude,
        position.coords.longitude,
      );

      switch (result.status) {
        case "granted":
          setMessage({
            tone: "success",
            text: `+${result.xpGranted}ポイント獲得しました！`,
          });
          onSuccess?.();
          router.refresh();
          return;
        case "already":
          setMessage({ tone: "error", text: "すでに獲得済みです。" });
          return;
        case "too_far": {
          const distanceKm = (result.distanceMeters / 1000).toFixed(1);
          setMessage({
            tone: "error",
            text: `スポットから離れているようです（約${distanceKm}km）。現地に着いてからもう一度押してください。`,
          });
          return;
        }
        case "unavailable":
          setMessage({
            tone: "error",
            text: "このミッションは現在受付を停止しています。",
          });
          return;
        case "not_configured":
          setMessage({
            tone: "error",
            text: "このミッションはまだ位置情報の設定が完了していません。運営にお問い合わせください。",
          });
          return;
        case "unauthenticated":
          setMessage({
            tone: "error",
            text: "ログインし直してからもう一度お試しください。",
          });
          return;
        case "invalid":
          setMessage({
            tone: "error",
            text: "このミッションは達成できませんでした。",
          });
          return;
        default:
          setMessage({
            tone: "error",
            text: result.message,
          });
      }
    });
  };

  return (
    <div className="rounded-xl border-2 bg-white p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Navigation className="h-10 w-10 text-gray-700" aria-hidden="true" />
        <p className="text-lg font-bold">現地に着いたらボタンを押そう</p>
        <p className="text-sm text-gray-600">
          その場で「イベントに来た」を押すと、位置情報を確認してミッション達成になります。
        </p>

        <Button
          size="lg"
          className="mt-1 w-full sm:w-auto"
          onClick={handleClick}
          disabled={isPending}
        >
          {isPending ? "確認中..." : "イベントに来た"}
        </Button>

        {message && (
          <p
            className={`text-sm ${message.tone === "success" ? "text-green-700" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}

        {hasLocation && (
          <a
            href={googleMapsSearchUrl(latitude, longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm underline underline-offset-2"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            地図で場所を見る
          </a>
        )}
      </div>
    </div>
  );
}
