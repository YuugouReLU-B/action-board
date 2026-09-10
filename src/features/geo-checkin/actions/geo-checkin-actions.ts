"use server";

import { redeemGeoCheckin } from "@/features/geo-checkin/use-cases/redeem-geo-checkin";
import { getUser } from "@/features/user-profile/services/profile";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { createClient } from "@/lib/supabase/client";

export type GeoCheckinActionResult =
  | { status: "unauthenticated" }
  | Awaited<ReturnType<typeof redeemGeoCheckin>>;

/**
 * userIdはクライアントから受け取らず、必ずセッションから取る。
 * 位置情報（緯度経度）だけをブラウザから受け取り、判定はサーバー側で行う。
 */
export async function geoCheckinAction(
  missionId: string,
  latitude: number,
  longitude: number,
): Promise<GeoCheckinActionResult> {
  const user = await getUser();
  if (!user) {
    return { status: "unauthenticated" };
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { status: "invalid" };
  }

  const adminSupabase = await createAdminClient();
  const userSupabase = createClient();

  return redeemGeoCheckin(
    adminSupabase,
    userSupabase,
    user.id,
    missionId,
    latitude,
    longitude,
  );
}
