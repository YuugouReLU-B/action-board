import type { Enums } from "@/lib/types/supabase";

export const MISSION_REGION_LABELS = {
  IWAKI: "いわき市",
  HIRONO: "広野町",
  NARAHA: "楢葉町",
  TOMIOKA: "富岡町",
  OKUMA: "大熊町",
  FUTABA: "双葉町",
  NAMIE: "浪江町",
  KATSURAO: "葛尾村",
  KAWAUCHI: "川内村",
  MINAMISOMA: "南相馬市",
  IITATE: "飯舘村",
  SHINCHI: "新地町",
  SOMA: "相馬市",
  TOKYO: "東京",
  WIDE: "広域",
} satisfies Record<Enums<"mission_region">, string>;

export function getMissionRegionLabel(
  region: Enums<"mission_region"> | null,
): string | null {
  return region ? MISSION_REGION_LABELS[region] : null;
}
