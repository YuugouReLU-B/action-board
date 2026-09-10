import { z } from "zod";
import { ARTIFACT_TYPES } from "@/lib/types/artifact-types";

/** slug はURLに出るので、扱いやすい文字だけに限る */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export const missionSchema = z
  .object({
    slug: z
      .string()
      .min(1, "slugは必須です")
      .max(80, "slugが長すぎます")
      .regex(
        SLUG_PATTERN,
        "slugは半角英小文字・数字・ハイフンで入力してください",
      ),
    title: z.string().min(1, "タイトルは必須です").max(200),
    content: z.string().max(20000).optional().nullable(),
    icon_url: z.string().max(500).optional().nullable(),
    required_artifact_type: z.enum(
      Object.keys(ARTIFACT_TYPES) as [string, ...string[]],
    ),
    difficulty: z.coerce.number().int().min(1).max(5),
    points: z.coerce.number().int().min(0).max(100000),
    max_achievement_count: z.coerce.number().int().min(1).nullable(),
    is_featured: z.boolean(),
    is_hidden: z.boolean(),
    event_date: z.string().optional().nullable(),
    artifact_label: z.string().max(200).optional().nullable(),
    latitude: z.coerce.number().min(-90).max(90).nullable(),
    longitude: z.coerce.number().min(-180).max(180).nullable(),
    radius_meters: z.coerce.number().int().min(1).max(20000).nullable(),
  })
  .refine(
    (data) =>
      data.required_artifact_type !== ARTIFACT_TYPES.GEO_CHECKIN.key ||
      (data.latitude !== null &&
        data.longitude !== null &&
        data.radius_meters !== null),
    {
      message: "位置情報チェックインには緯度・経度・判定半径がすべて必要です",
      path: ["radius_meters"],
    },
  );

export type MissionInput = z.input<typeof missionSchema>;
export type MissionSchemaOutput = z.output<typeof missionSchema>;
