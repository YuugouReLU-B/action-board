"use server";

import {
  fetchAchievementData as fetchAchievementDataService,
  fetchRegistrationData as fetchRegistrationDataService,
} from "../services/get-metrics";

export async function fetchAchievementData(startDate?: Date) {
  return fetchAchievementDataService(startDate);
}

export async function fetchRegistrationData() {
  return fetchRegistrationDataService();
}
