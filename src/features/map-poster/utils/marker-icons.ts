import type { Database } from "@/lib/types/supabase";

type BoardStatus = Database["public"]["Enums"]["poster_board_status"];

/** Status colors for poster board markers */
export const statusColors: Record<BoardStatus, string> = {
  not_yet: "var(--app-poster-not-yet)", // gray
  not_yet_dangerous: "var(--app-poster-not-yet)", // gray
  reserved: "var(--app-poster-reserved)", // yellow/orange
  done: "var(--app-poster-done)", // green
  error_wrong_place: "var(--app-poster-error)", // red
  error_damaged: "var(--app-poster-error)", // red
  error_wrong_poster: "var(--app-poster-error)", // red
  other: "var(--app-poster-other)", // purple
};

/**
 * Create an HTML string for a circular marker icon with a status-based color.
 */
export function createMarkerIconHtml(status: BoardStatus): string {
  const color = statusColors[status];

  return `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `;
}

const statusOrder: BoardStatus[] = [
  "done",
  "reserved",
  "not_yet",
  "not_yet_dangerous",
  "error_wrong_place",
  "error_damaged",
  "error_wrong_poster",
  "other",
];

/**
 * Create SVG pie chart segments string from status counts.
 * Each segment represents the proportion of boards with that status.
 */
export function createPieSegments(
  statusCounts: Record<BoardStatus, number>,
  total: number,
  size: number,
): string {
  const segments: string[] = [];
  const radius = (size - 6) / 2; // Account for border
  const center = size / 2;

  // Start from top (-90 degrees)
  let cumulativePercentage = 0;

  for (const status of statusOrder) {
    const count = statusCounts[status];
    if (count === 0) continue;

    const percentage = count / total;

    if (percentage >= 1) {
      // Full circle
      segments.push(
        `<circle cx="${center}" cy="${center}" r="${radius}" fill="${statusColors[status]}" />`,
      );
      break;
    }

    // Calculate stroke-dasharray for this segment
    const circumference = 2 * Math.PI * radius;
    const strokeLength = circumference * percentage;
    const gapLength = circumference - strokeLength;

    // Rotate the circle so this segment appears at the right position
    const rotation = cumulativePercentage * 360 - 90; // -90 to start from top

    segments.push(`
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="none"
        stroke="${statusColors[status]}"
        stroke-width="${radius * 2}"
        stroke-dasharray="${strokeLength} ${gapLength}"
        stroke-dashoffset="0"
        transform="rotate(${rotation} ${center} ${center})"
        opacity="1"
      />
    `);

    cumulativePercentage += percentage;
  }

  return segments.join("");
}
