import { redirect } from "next/navigation";
import type { Message } from "@/components/common/form-message";
import { LotteryEntryPanel } from "@/features/lottery/components/lottery-entry-panel";
import { getFirstMissionPath } from "@/features/missions/services/first-mission";
import {
  getMyProfile,
  getProfile,
  getUser,
} from "@/features/user-profile/services/profile";
import { AccountDeletionSection } from "@/features/user-settings/components/account-deletion-section";
import { LoginSection } from "@/features/user-settings/components/login-section";
import ProfileForm from "@/features/user-settings/components/profile-form";
import { createAdminClient } from "@/lib/supabase/adminClient";

type ProfileSettingsPageSearchParams = {
  new: string;
  type?: string; // email_change などのタイプ
} & Message;

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<ProfileSettingsPageSearchParams | undefined>;
}) {
  const params = await searchParams;

  const user = await getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // ユーザー情報を取得
  const privateUser = await getMyProfile();
  const publicUser = await getProfile(user.id);

  // 新規ユーザーかどうか判定
  const isNew = Boolean(params?.new);

  // メールアドレス変更成功メッセージ
  const isEmailChangeSuccessful = params?.type === "email_change";

  // 登録直後はトップではなく最初のミッションへ送る
  const nextUrlAfterSignup = await getFirstMissionPath(
    await createAdminClient(),
    user.id,
  );

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <ProfileForm
        message={params}
        isNew={isNew}
        initialProfile={{
          name: publicUser?.name || user.user_metadata.name || "",
          address_prefecture: publicUser?.address_prefecture || "",
          date_of_birth:
            privateUser?.date_of_birth ?? user.user_metadata.date_of_birth,
          x_username: publicUser?.x_username || null,
          github_username: publicUser?.github_username || null,
        }}
        nextUrlAfterSignup={nextUrlAfterSignup}
      />

      {!isNew && (
        <div className="w-full max-w-md pt-4 ">
          <LoginSection
            user={user}
            isEmailChangeSuccessful={isEmailChangeSuccessful}
          />
        </div>
      )}

      {!isNew && (
        <div className="w-full max-w-md pt-4">
          <LotteryEntryPanel />
        </div>
      )}

      {!isNew && <AccountDeletionSection />}
    </div>
  );
}
