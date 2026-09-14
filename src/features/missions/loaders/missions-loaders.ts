"use server";

import type { GetMissionsFilterOptions } from "../services/missions";
import {
  getMissionCategoryView as getMissionCategoryViewService,
  getMissionsForRanking as getMissionsForRankingService,
  getMissionsWithFilter as getMissionsWithFilterService,
  hasFeaturedMissions as hasFeaturedMissionsService,
} from "../services/missions";

export async function getMissionsForRanking() {
  return getMissionsForRankingService();
}

export async function hasFeaturedMissions() {
  return hasFeaturedMissionsService();
}

export async function getMissionsWithFilter(
  options?: GetMissionsFilterOptions,
) {
  return getMissionsWithFilterService(options);
}

export async function getMissionCategoryView() {
  return getMissionCategoryViewService();
}
