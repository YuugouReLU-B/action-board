"use server";

import {
  getUserAchievedMissions as getUserAchievedMissionsService,
  getUserMissionAchievements as getUserMissionAchievementsService,
  getUserRepeatableMissionAchievements as getUserRepeatableMissionAchievementsService,
} from "../services/achievements";

export async function getUserRepeatableMissionAchievements(
  userId: string,
  seasonId?: string,
) {
  return getUserRepeatableMissionAchievementsService(userId, seasonId);
}

export async function getUserMissionAchievements(userId: string) {
  return getUserMissionAchievementsService(userId);
}

export async function getUserAchievedMissions(
  userId: string,
  seasonId?: string,
) {
  return getUserAchievedMissionsService(userId, seasonId);
}
