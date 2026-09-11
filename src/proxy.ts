import type { NextRequest } from "next/server";
import { resolveBasicAuthResponse } from "@/lib/middleware/basic-auth";
import { resolveMaintenanceResponse } from "@/lib/middleware/maintenance";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // ベータ公開前のゲート。何よりも先に判定して、メンテナンス画面すら見せない
  const basicAuthResponse = resolveBasicAuthResponse(request);

  if (basicAuthResponse) {
    return basicAuthResponse;
  }

  const maintenanceResponse = resolveMaintenanceResponse(request);

  if (maintenanceResponse) {
    return maintenanceResponse;
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - audio - .mp3, .ogg, .wav
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ogg|wav)$).*)",
  ],
};
