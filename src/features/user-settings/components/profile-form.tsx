"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { CollapsibleInfo } from "@/components/common/collapsible-info";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "@/features/user-settings/actions/profile-actions";
import { PrefectureSelect } from "@/features/user-settings/components/prefecture-select";
import {
  formatBirthDate,
  generateDaysArray,
} from "@/lib/utils/date-form-utils";
import { verifyMinimumAge } from "@/lib/utils/form-date-utils";

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
  initialPrivateUser: {
    id?: string;
    postcode?: string;
  } | null;
}

export default function ProfileForm({
  message,
  isNew,
  initialProfile,
  initialPrivateUser,
}: ProfileFormProps) {
  const [queryMessage, setQueryMessage] = useState<Message | undefined>(
    message,
  );
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>(
    initialProfile?.address_prefecture || "",
  );

  // 生年月日の状態を追加
  const initialDate = initialProfile?.date_of_birth
    ? new Date(initialProfile.date_of_birth)
    : null;
  const [selectedYear, setSelectedYear] = useState(
    initialDate?.getFullYear() || 1990,
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (initialDate?.getMonth() || 0) + 1,
  );
  const [selectedDay, setSelectedDay] = useState(initialDate?.getDate() || 1);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [isAgeValid, setIsAgeValid] = useState(true);

  const router = useRouter();

  // 年月日の選択肢を生成
  const birthYearThreshold = new Date().getFullYear() - 18;
  const years = Array.from({ length: 100 }, (_, i) => birthYearThreshold - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = generateDaysArray(selectedYear, selectedMonth);

  const formattedDate = formatBirthDate(
    selectedYear,
    selectedMonth,
    selectedDay,
  );

  // 年齢チェック関数
  const verifyAge = useCallback((birthdate: string): void => {
    const result = verifyMinimumAge(birthdate, 18);
    setAgeError(result.message);
    setIsAgeValid(result.isValid);
  }, []);

  useEffect(() => {
    // フォーム送信成功時の処理
    if (state?.success && isNew) {
      router.push("/");
    }
    if (state?.success) {
      setQueryMessage(undefined);
    }
  }, [state?.success, isNew, router]);

  // 生年月日が変更された際に年齢チェックを実行
  useEffect(() => {
    verifyAge(formattedDate);
  }, [formattedDate, verifyAge]);

  // 月を変更した際、日付が月の日数を超えていたら1日に変更する
  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    if (selectedDay > daysInMonth) {
      setSelectedDay(1);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

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

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">生年月日</Label>
            <p className="text-sm text-gray-500">この項目は公開されません</p>
            {/* 生年月日が必要な理由の説明エリア（折りたたみ可能） */}
            <CollapsibleInfo title="なぜ生年月日が必要ですか？" variant="gray">
              <p>
                法律により、サポーター登録は満18歳以上の方に限定されているため、年齢確認が必要です。
              </p>
              <p>
                プライバシーポリシーに従って厳重に管理され、他の目的には使用されません。
              </p>
            </CollapsibleInfo>
            <fieldset
              className="grid grid-cols-3 gap-2"
              aria-labelledby="date_of_birth"
            >
              <legend className="sr-only">生年月日の選択</legend>
              <div>
                <Label htmlFor="date_of_birth_year" className="sr-only">
                  年
                </Label>
                <Select
                  name="year_select"
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                  required
                  disabled={isPending}
                >
                  <SelectTrigger data-testid="year_select">
                    <SelectValue placeholder="年" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth_month" className="sr-only">
                  月
                </Label>
                <Select
                  name="month_select"
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(Number(value))}
                  required
                  disabled={isPending}
                >
                  <SelectTrigger data-testid="month_select">
                    <SelectValue placeholder="月" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {month}月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth_day" className="sr-only">
                  日
                </Label>
                <Select
                  name="day_select"
                  value={selectedDay.toString()}
                  onValueChange={(value) => setSelectedDay(Number(value))}
                  required
                  disabled={isPending}
                >
                  <SelectTrigger data-testid="day_select">
                    <SelectValue placeholder="日" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}日
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </fieldset>
            {ageError && (
              <p className="text-brand-ink text-sm font-medium mb-2">
                {ageError}
              </p>
            )}
            {/* 隠しフィールドでフォーマット済みの日付を送信 */}
            <input type="hidden" name="date_of_birth" value={formattedDate} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_prefecture">都道府県</Label>
            <PrefectureSelect
              name="address_prefecture"
              id="address_prefecture"
              defaultValue={initialProfile?.address_prefecture || ""}
              required
              disabled={isPending}
              onValueChange={setSelectedPrefecture}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postcode">郵便番号(ハイフンなし半角7桁)</Label>
            <p className="text-sm text-gray-500">この項目は公開されません</p>
            {/* 郵便番号が必要な理由の説明エリア（折りたたみ可能） */}
            <CollapsibleInfo title="なぜ郵便番号が必要ですか？" variant="gray">
              <p>
                郵便番号は、ポスティングなど地域別のミッションを適切に届けるために必要です。
              </p>
              <p>
                プライバシーポリシーに従って厳重に管理され、他の目的には使用されません。
              </p>
            </CollapsibleInfo>
            {selectedPrefecture === "海外" && (
              <p className="text-sm text-red-600">
                海外在住の方は0000000を入力ください
              </p>
            )}
            <Input
              id="postcode"
              name="postcode"
              type="text"
              defaultValue={initialPrivateUser?.postcode || ""}
              placeholder="郵便番号(ハイフンなし半角7桁)"
              pattern="[0-9]{7}"
              maxLength={7}
              required
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
          <SubmitButton className="w-full" disabled={isPending || !isAgeValid}>
            {isNew ? "登録する" : "更新する"}
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
