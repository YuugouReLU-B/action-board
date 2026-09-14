"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MissionIcon } from "@/features/missions/components/mission-icon";
import { getEventCategoryIcon } from "@/features/missions/constants/quest-categories";
import { calculateMissionXp } from "@/features/user-level/utils/level-calculator";
import {
  POSTER_POINTS_PER_UNIT,
  POSTING_POINTS_PER_UNIT,
} from "@/lib/constants/mission-config";
import type { Tables } from "@/lib/types/supabase";
import MissionAchievementStatus from "./mission-achievement-status";

interface MissionProps {
  mission: Tables<"missions">;
  userAchievementCount: number;
}

export default function Mission({
  mission,
  userAchievementCount,
}: MissionProps) {
  // 最大達成回数が設定されている場合、ユーザーの達成回数が最大に達しているかどうかを確認
  const hasReachedMaxAchievements =
    mission.max_achievement_count !== null &&
    userAchievementCount >= (mission.max_achievement_count || 0);

  const iconUrl = getEventCategoryIcon(mission.event_category);

  // ボタン文言に埋め込むポイント表示（以前はバッジで表示していたもの）
  const pointsLabel =
    mission.required_artifact_type === "POSTER"
      ? `1枚あたり${POSTER_POINTS_PER_UNIT}P`
      : mission.required_artifact_type === "POSTING"
        ? `1枚あたり${POSTING_POINTS_PER_UNIT}P`
        : `${calculateMissionXp({ points: mission.points })}P`;

  // 日付の整形
  const eventDate = mission.event_date ? new Date(mission.event_date) : null;
  const dateStr = eventDate
    ? `${eventDate.getMonth() + 1}月${eventDate.getDate()}日（${["日", "月", "火", "水", "木", "金", "土"][eventDate.getDay()]}）開催`
    : null;

  return (
    <article>
      <Card className="@container/card">
        <CardHeader className="relative">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full p-[3px]">
                <div className="flex items-center justify-center w-full h-full rounded-full bg-white">
                  <MissionIcon src={iconUrl} alt={mission.title} size="md" />
                </div>
              </div>
              <MissionAchievementStatus
                hasReachedMaxAchievements={hasReachedMaxAchievements}
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight mb-2 text-gray-900">
                {mission.title}
              </CardTitle>
              {dateStr && (
                <div className="text-sm font-medium text-gray-600">
                  {dateStr}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardFooter className="flex flex-col items-stretch gap-3">
          {(mission.tag1 || mission.tag2) && (
            <div className="flex flex-wrap items-center gap-2">
              {mission.tag1 && (
                <Badge variant="outline" className="text-xs px-2">
                  <MapPin size={14} className="mr-1" />
                  <span className="text-sm font-medium text-gray-700">
                    {mission.tag1}
                  </span>
                </Badge>
              )}
              {mission.tag2 && (
                <Badge variant="outline" className="text-xs px-2">
                  <span className="text-sm font-medium text-gray-700">
                    {mission.tag2}
                  </span>
                </Badge>
              )}
            </div>
          )}
          <Link
            href={`/missions/${mission.slug || mission.id}`}
            className="block"
          >
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="default"
                className={clsx(
                  // bg-primary と対になる前景色を使う。text-white を直書きすると
                  // プライマリ色を変えたときに読めなくなる
                  "w-full rounded-full py-6 text-base font-bold text-primary-foreground border-none",
                  hasReachedMaxAchievements
                    ? "bg-gray-300 hover:bg-gray-300/90 text-gray-700"
                    : userAchievementCount === 0
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-yellow-300 hover:bg-yellow-300/90 text-black",
                )}
              >
                {hasReachedMaxAchievements
                  ? "クリア済み"
                  : userAchievementCount === 0
                    ? `${pointsLabel}獲得`
                    : `もう一回${pointsLabel}獲得`}
              </Button>
            </motion.div>
          </Link>
        </CardFooter>
      </Card>
    </article>
  );
}
