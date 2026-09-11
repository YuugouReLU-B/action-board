"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { FormMessage, type Message } from "@/components/common/form-message";
import { SubmitButton } from "@/components/common/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/features/user-settings/actions/profile-actions";
import { PrefectureSelect } from "@/features/user-settings/components/prefecture-select";

interface ProfileFormProps {
  message?: Message;
  isNew: boolean;
  initialProfile: {
    name?: string;
    address_prefecture?: string;
    date_of_birth?: string;
    x_username?: string | null;
    github_username?: string | null;
  } | null;
  /** 新規登録時、プロフィール保存後に遷移する先 */
  nextUrlAfterSignup: string;
}

export default function ProfileForm({
  message,
  isNew,
  initialProfile,
  nextUrlAfterSignup,
}: ProfileFormProps) {
  const [queryMessage, setQueryMessage] = useState<Message | undefined>(
    message,
  );
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const router = useRouter();

  useEffect(() => {
    // 新規登録時は、プロフィール保存後にそのまま最初のミッションへ送る。
    // 以前はトップに戻していたが、次に何をすればよいか分からない導線だった
    if (state?.success && isNew) {
      router.push(nextUrlAfterSignup);
    }
    if (state?.success) {
      setQueryMessage(undefined);
    }
  }, [state?.success, isNew, router, nextUrlAfterSignup]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>プロフィール設定</CardTitle>
        <CardDescription>
          {isNew
            ? "公開されるプロフィール情報を登録します。"
            : "公開されるプロフィール情報を編集します。"}
        </CardDescription>
      </CardHeader>
      {queryMessage && (
        <div className="p-2 mb-4">
          <FormMessage message={queryMessage} />
        </div>
      )}
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ニックネーム</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={initialProfile?.name || ""}
              placeholder="あなたのニックネーム"
              maxLength={100}
              required
              disabled={isPending}
            />
          </div>

          {/* 以下はアンケート項目。すべて任意。
              収集を続けるか項目ごと削るかは次回MTGで決める */}
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">
              生年月日 <span className="text-gray-500">（任意）</span>
            </Label>
            <p className="text-sm text-gray-500">
              この項目は公開されません。答えたくない場合は空のままで構いません。
            </p>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={initialProfile?.date_of_birth || ""}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_prefecture">
              都道府県 <span className="text-gray-500">（任意）</span>
            </Label>
            <p className="text-sm text-gray-500">
              どの地域から来てくださったかの参考にさせていただきます。
            </p>
            <PrefectureSelect
              name="address_prefecture"
              id="address_prefecture"
              defaultValue={initialProfile?.address_prefecture || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="x_username">X(旧Twitter)のユーザー名</Label>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                オプション
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Xのユーザー名を設定すると、あなたのプロフィールに表示することができます。
            </p>
            <Input
              id="x_username"
              name="x_username"
              type="text"
              defaultValue={initialProfile?.x_username || ""}
              placeholder="@を除いたユーザー名"
              disabled={isPending}
              maxLength={50}
            />
          </div>
          {!isNew && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="github_username">GitHubのユーザー名</Label>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  オプション
                </span>
              </div>
              <p className="text-sm text-gray-500">
                GitHubのユーザー名を設定すると、あなたのプロフィールに表示することができます。
              </p>
              <Input
                id="github_username"
                name="github_username"
                type="text"
                defaultValue={initialProfile?.github_username || ""}
                placeholder="GitHubのユーザー名"
                disabled={isPending}
                maxLength={39}
              />
            </div>
          )}
          {state?.success && (
            <p className="text-center text-sm text-green-600">
              {isNew
                ? "プロフィールを新規登録しました。"
                : "プロフィールを更新しました。"}
            </p>
          )}
          {state?.error && (
            <p className="text-center text-sm text-red-600">{state.error}</p>
          )}
        </CardContent>
        <CardFooter>
          <SubmitButton className="w-full" disabled={isPending}>
            {isNew ? "登録する" : "更新する"}
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
