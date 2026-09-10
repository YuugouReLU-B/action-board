"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AdminActionResult } from "@/features/admin/actions/mission-actions";
import type { AdminCategory } from "@/features/admin/services/admin-categories";
import { defaultPointsForDifficulty } from "@/features/user-level/utils/level-calculator";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";
import type { Tables } from "@/lib/types/supabase";

type MissionFormProps = {
  /** 編集時は既存のミッション。新規作成時は undefined */
  mission?: Tables<"missions">;
  categories: AdminCategory[];
  /** 編集時に既に紐付いているカテゴリ */
  selectedCategoryIds?: string[];
  action: (formData: FormData) => Promise<AdminActionResult>;
  submitLabel: string;
};

const ARTIFACT_TYPE_OPTIONS = Object.values(ARTIFACT_TYPES).map((type) => ({
  value: type.key,
  label: `${type.displayName}（${type.key}）`,
}));

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  /** 対応する入力要素の id。ラベルをクリックしたときに移動できるようにする */
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-bold">
        {label}
      </label>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export function MissionForm({
  mission,
  categories,
  selectedCategoryIds = [],
  action,
  submitLabel,
}: MissionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>(selectedCategoryIds);
  const [artifactType, setArtifactType] = useState(
    mission?.required_artifact_type ?? ARTIFACT_TYPES.GEO_CHECKIN.key,
  );
  const [difficulty, setDifficulty] = useState(mission?.difficulty ?? 1);
  // 新規作成時だけ難易度に追従させる。既存の値を勝手に書き換えない
  const [points, setPoints] = useState(
    mission?.points ?? defaultPointsForDifficulty(1),
  );

  const isQrSpot = artifactType === ARTIFACT_TYPES.QR.key;
  const isGeoCheckin = artifactType === ARTIFACT_TYPES.GEO_CHECKIN.key;
  const hasLocationFields = isQrSpot || isGeoCheckin;

  const toggleCategory = (categoryId: string) => {
    setCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/admin/missions/${result.missionId}`);
      router.refresh();
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          htmlFor="slug"
          label="slug"
          hint="URLに使う。あとから変えるとリンクが切れる"
        >
          <input
            name="slug"
            id="slug"
            defaultValue={mission?.slug}
            required
            pattern="[a-z0-9][a-z0-9\-]*"
            className={inputClass}
            placeholder="michinoeki-namie"
          />
        </Field>

        <Field htmlFor="title" label="タイトル">
          <input
            name="title"
            id="title"
            defaultValue={mission?.title}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-2 text-sm font-bold">出すカテゴリ</legend>
        <p className="mb-3 text-xs text-gray-500">
          トップページはカテゴリごとにミッションを並べています。
          どれも選ばないと、公開にしてもトップページには出ません。
        </p>

        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">
            カテゴリがまだありません（mission_data/categories.yaml で作ります）
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="category_ids"
                  value={category.id}
                  checked={categoryIds.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                <span
                  className={
                    category.visibleMissionCount === 0 ? "text-gray-400" : ""
                  }
                >
                  {category.title}
                  <span className="ml-1 text-xs text-gray-500">
                    {category.visibleMissionCount === 0
                      ? "（未使用）"
                      : `（公開 ${category.visibleMissionCount}）`}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {categories.length > 0 && categoryIds.length === 0 && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
            カテゴリを選んでいないので、トップページには出ません。
            URLを直接開いた人だけが見られる状態になります。
          </p>
        )}
      </fieldset>

      <Field htmlFor="content" label="説明" hint="HTMLを書ける">
        <textarea
          name="content"
          id="content"
          defaultValue={mission?.content ?? ""}
          rows={5}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          htmlFor="icon_url"
          label="アイコンのパス"
          hint="例: /img/mission-icons/xxx.svg"
        >
          <input
            name="icon_url"
            id="icon_url"
            defaultValue={mission?.icon_url ?? ""}
            className={inputClass}
          />
        </Field>

        <Field htmlFor="required_artifact_type" label="達成の種類">
          <select
            name="required_artifact_type"
            id="required_artifact_type"
            value={artifactType}
            onChange={(e) => setArtifactType(e.target.value)}
            className={inputClass}
          >
            {ARTIFACT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          htmlFor="difficulty"
          label="難易度（★の数）"
          hint="表示だけ。ポイントには影響しない"
        >
          <select
            name="difficulty"
            id="difficulty"
            value={difficulty}
            onChange={(e) => {
              const next = Number(e.target.value);
              setDifficulty(next);
              // 新規作成のときだけ既定値を追従させる
              if (!mission) setPoints(defaultPointsForDifficulty(next));
            }}
            className={inputClass}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)}
              </option>
            ))}
          </select>
        </Field>

        <Field htmlFor="points" label="ポイント" hint="実際に付与されるXP">
          <input
            name="points"
            id="points"
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            required
            className={inputClass}
          />
        </Field>

        <Field
          htmlFor="max_achievement_count"
          label="達成できる回数"
          hint="空欄なら無制限"
        >
          <input
            name="max_achievement_count"
            id="max_achievement_count"
            type="number"
            min={1}
            defaultValue={mission?.max_achievement_count ?? 1}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          htmlFor="artifact_label"
          label="提出物のラベル"
          hint="提出欄の見出し。不要なら空欄"
        >
          <input
            name="artifact_label"
            id="artifact_label"
            defaultValue={mission?.artifact_label ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          htmlFor="event_date"
          label="イベント日"
          hint="イベント系ミッションのみ"
        >
          <input
            name="event_date"
            id="event_date"
            type="date"
            defaultValue={mission?.event_date ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      {hasLocationFields && (
        <fieldset className="rounded-lg border border-gray-200 p-4">
          <legend className="px-2 text-sm font-bold">スポットの位置</legend>
          <p className="mb-3 text-xs text-gray-500">
            {isGeoCheckin
              ? "「イベントに来た」ボタンを押した位置から、この座標を中心とした半径以内なら達成になります。"
              : "ベータでは位置による判定はしません。周遊の集計と、あとから「スポットの近くでしか読めない」を足すために記録しておきます。"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field htmlFor="latitude" label="緯度">
              <input
                name="latitude"
                id="latitude"
                type="number"
                step="any"
                required={isGeoCheckin}
                defaultValue={mission?.latitude ?? ""}
                className={inputClass}
                placeholder="37.4917"
              />
            </Field>
            <Field htmlFor="longitude" label="経度">
              <input
                name="longitude"
                id="longitude"
                type="number"
                step="any"
                required={isGeoCheckin}
                defaultValue={mission?.longitude ?? ""}
                className={inputClass}
                placeholder="141.0000"
              />
            </Field>
          </div>

          {isGeoCheckin && (
            <div className="mt-5">
              <Field
                htmlFor="radius_meters"
                label="判定半径（m）"
                hint="この距離以内なら達成になる。会場の広さに合わせて調整する"
              >
                <input
                  name="radius_meters"
                  id="radius_meters"
                  type="number"
                  min={1}
                  required
                  defaultValue={mission?.radius_meters ?? 300}
                  className={inputClass}
                  placeholder="300"
                />
              </Field>
            </div>
          )}
        </fieldset>
      )}

      {!hasLocationFields && (
        <>
          <input type="hidden" name="latitude" value="" />
          <input type="hidden" name="longitude" value="" />
        </>
      )}

      {!isGeoCheckin && <input type="hidden" name="radius_meters" value="" />}

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_hidden"
            defaultChecked={mission?.is_hidden ?? true}
          />
          非表示にする
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={mission?.is_featured ?? false}
          />
          注目ミッション（ポイント2倍）
        </label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/missions")}
          disabled={isPending}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
