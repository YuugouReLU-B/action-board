import Link from "next/link";
import { UserName } from "@/components/common/user-name";
import { UserTopBadge } from "@/features/user-badges/components/user-top-badge";
import { getUserLevel } from "@/features/user-level/services/level";
import { getProfile } from "@/features/user-profile/services/profile";

interface LevelsProps {
  userId: string;
  clickable?: boolean;
  showBadge?: boolean;
  seasonId?: string;
}

// TODO: UserProfileCardにリネーム
export default async function Levels({
  userId,
  clickable = false,
  showBadge = false,
  seasonId,
}: LevelsProps) {
  const profile = await getProfile(userId);

  if (!profile) {
    throw new Error("Private user data not found");
  }

  const userLevel = await getUserLevel(userId, seasonId);

  const cardContent = (
    <div
      className={`w-full flex flex-col items-stretch bg-white rounded-md p-6 ${clickable ? "hover:bg-gray-50 transition-colors max-w-lg" : "max-w-md"}`}
    >
      <div className="flex flex-col min-w-0">
        <UserName name={profile.name} nameClassName="text-2xl font-bold" />
        <div className="mt-2 text-2xl font-bold">
          {userLevel ? userLevel.xp.toLocaleString() : "0"} ポイント
        </div>
      </div>
      {showBadge && (
        <div className="mt-3">
          <UserTopBadge userId={userId} seasonId={seasonId} />
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <section className="flex justify-center py-6 px-4">
        <Link
          href={`/users/${userId}`}
          aria-label={`${profile.name}さんのプロフィールへ`}
          className="w-full max-w-xl flex justify-center"
        >
          {cardContent}
        </Link>
      </section>
    );
  }

  return (
    <section className="flex justify-center py-6 px-4">{cardContent}</section>
  );
}
