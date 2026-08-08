import "server-only";

import fs from "node:fs";
import path from "node:path";

export interface RouteEntry {
  /** `/missions/[slug]` のようなルートパス */
  route: string;
  /** リポジトリルートからの page.tsx のパス */
  file: string;
  /** `[slug]` などの動的セグメントを含むか */
  isDynamic: boolean;
  /** 動的セグメント名の一覧（例: `["slug"]`） */
  dynamicSegments: string[];
  /** `(protected)` 配下にあるか（ログイン必須） */
  isProtected: boolean;
  /** `(auth-pages)` などのルートグループ名 */
  groups: string[];
}

const APP_DIR = path.join("src", "app");
const PAGE_FILENAMES = ["page.tsx", "page.ts", "page.jsx", "page.js"];

/** `(protected)` のようなルートグループか */
function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

/** `[slug]` `[...slug]` `[[...slug]]` のような動的セグメントか */
function isDynamicSegment(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

/** `[...slug]` から `slug` を取り出す */
function dynamicSegmentName(segment: string): string {
  return segment.replace(/^\[+\.*/, "").replace(/\]+$/, "");
}

/**
 * ディレクトリのセグメント列を URL パスへ変換する。
 * ルートグループ（括弧付き）は URL に現れない。
 */
export function segmentsToRoute(segments: string[]): string {
  const visible = segments.filter((segment) => !isRouteGroup(segment));
  return visible.length === 0 ? "/" : `/${visible.join("/")}`;
}

function walk(absoluteDir: string, segments: string[], found: RouteEntry[]) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  } catch {
    return;
  }

  const pageFile = entries.find(
    (entry) => entry.isFile() && PAGE_FILENAMES.includes(entry.name),
  );

  if (pageFile) {
    const dynamicSegments = segments
      .filter(isDynamicSegment)
      .map(dynamicSegmentName);

    found.push({
      route: segmentsToRoute(segments),
      file: path.join(APP_DIR, ...segments, pageFile.name),
      isDynamic: dynamicSegments.length > 0,
      dynamicSegments,
      isProtected: segments.includes("(protected)"),
      groups: segments.filter(isRouteGroup),
    });
  }

  for (const entry of entries) {
    // `_components` のようなプライベートディレクトリと `@modal` はルートにならない
    if (
      !entry.isDirectory() ||
      entry.name.startsWith("_") ||
      entry.name.startsWith("@")
    ) {
      continue;
    }
    walk(path.join(absoluteDir, entry.name), [...segments, entry.name], found);
  }
}

/**
 * `src/app` を走査して、実在する全ページルートを列挙する。
 *
 * 開発用ページからしか呼ばないため、実行のたびにファイルシステムを読む。
 */
export function listAppRoutes(cwd: string = process.cwd()): RouteEntry[] {
  const found: RouteEntry[] = [];
  walk(path.join(cwd, APP_DIR), [], found);

  return found.sort((a, b) => a.route.localeCompare(b.route));
}
