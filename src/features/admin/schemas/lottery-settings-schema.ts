import { z } from "zod";
import { isValidUrl } from "@/lib/utils/url-validation";

export const lotterySettingsSchema = z.object({
  threshold_points: z
    .string()
    .min(1, "しきい値は必須です")
    .pipe(z.coerce.number().int().min(0).max(1000000)),
  title: z.string().min(1, "見出しは必須です").max(100),
  description: z.string().min(1, "説明文は必須です").max(1000),
  button_label: z.string().min(1, "ボタンラベルは必須です").max(50),
  form_url: z
    .string()
    .max(1000)
    .refine((value) => value === "" || isValidUrl(value), {
      message: "リンク先URLは空欄か、http(s)の有効なURLで入力してください",
    }),
});

export type LotterySettingsInput = z.input<typeof lotterySettingsSchema>;
