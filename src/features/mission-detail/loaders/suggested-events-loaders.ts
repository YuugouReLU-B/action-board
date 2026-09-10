"use server";

import { getUser } from "@/features/user-profile/services/profile";
import { createAdminClient } from "@/lib/supabase/adminClient";
import {
  getSuggestedEvent,
  type SuggestedEvent,
} from "../services/suggested-events";

export async function loadSuggestedEvent(
  excludeMissionId: string,
): Promise<SuggestedEvent | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createAdminClient();
  return getSuggestedEvent(supabase, user.id, excludeMissionId);
}
