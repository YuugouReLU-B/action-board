import {
  Compass,
  GraduationCap,
  type LucideIcon,
  Mic,
  PartyPopper,
  ShoppingBasket,
  Sparkles,
  Trophy,
} from "lucide-react";

/**
 * イベント種別。アイコンをアップロードしていないミッションのフォールバック
 * アイコンを決めるための分類。
 */
export const EVENT_TYPES = {
  FESTIVAL: { key: "FESTIVAL", displayName: "祭り", icon: PartyPopper },
  MARKET: { key: "MARKET", displayName: "マルシェ", icon: ShoppingBasket },
  WORKSHOP: {
    key: "WORKSHOP",
    displayName: "教室・ワークショップ",
    icon: GraduationCap,
  },
  TOUR: { key: "TOUR", displayName: "ツアー", icon: Compass },
  TALK: { key: "TALK", displayName: "講演・交流会", icon: Mic },
  COMPETITION: {
    key: "COMPETITION",
    displayName: "大会・スポーツ",
    icon: Trophy,
  },
  OTHER: { key: "OTHER", displayName: "その他", icon: Sparkles },
} as const;

export type EventTypeKey = keyof typeof EVENT_TYPES;

export function getEventTypeConfig(
  typeKey: string | null | undefined,
): (typeof EVENT_TYPES)[EventTypeKey] | undefined {
  if (!typeKey || !Object.keys(EVENT_TYPES).includes(typeKey)) {
    return undefined;
  }
  return EVENT_TYPES[typeKey as EventTypeKey];
}

export function getEventTypeIcon(
  typeKey: string | null | undefined,
): LucideIcon {
  return getEventTypeConfig(typeKey)?.icon ?? EVENT_TYPES.OTHER.icon;
}
