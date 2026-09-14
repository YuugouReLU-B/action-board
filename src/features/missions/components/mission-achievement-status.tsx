import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MissionAchievementStatusProps {
  hasReachedMaxAchievements: boolean;
}

export default function MissionAchievementStatus({
  hasReachedMaxAchievements,
}: MissionAchievementStatusProps) {
  if (!hasReachedMaxAchievements) {
    return null;
  }

  return (
    <Badge variant="outline" className="text-xxs px-2 bg-neutral-950 -mt-3">
      <CheckIcon size={14} className="mr-1 text-white" />
      <span className="text-white">達成済み</span>
    </Badge>
  );
}
