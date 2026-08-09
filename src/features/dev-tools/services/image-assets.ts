import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import {
  IMAGE_ASSETS,
  type ImageAssetGroupKey,
  type ImageAssetStatus,
} from "@/features/dev-tools/constants/image-assets";
import { createAdminClient } from "@/lib/supabase/adminClient";

export type ImageAsset = {
  /** public/ からの絶対パス。<img src> にそのまま使える */
  path: string;
  label: string;
  group: ImageAssetGroupKey | "unlisted";
  status: ImageAssetStatus;
  usedIn: string[];
  note?: string;
  bytes: number;
  /** 取得できなかった形式は null */
  dimensions: { width: number; height: number } | null;
};

const PUBLIC_IMG_DIR = "public/img";
const MISSION_ICON_PREFIX = "/img/mission-icons/";

/** public/img 以下のファイルを再帰的に集める */
async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return files.flat();
}

/**
 * 画像の寸法を読む。
 *
 * デザイン担当に「何ピクセルで作り直すか」を伝えるために必要。
 * 依存を増やしたくないのでヘッダーだけ自前で読む。読めない形式は null を返す。
 */
async function readDimensions(
  file: string,
): Promise<{ width: number; height: number } | null> {
  const ext = path.extname(file).toLowerCase();

  if (ext === ".svg") {
    const text = await fs.readFile(file, "utf-8");
    const viewBox = text.match(
      /viewBox\s*=\s*["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/,
    );
    if (viewBox) {
      return {
        width: Math.round(Number(viewBox[1])),
        height: Math.round(Number(viewBox[2])),
      };
    }
    const w = text.match(/\swidth\s*=\s*["']([\d.]+)/);
    const h = text.match(/\sheight\s*=\s*["']([\d.]+)/);
    if (w && h) {
      return {
        width: Math.round(Number(w[1])),
        height: Math.round(Number(h[1])),
      };
    }
    return null;
  }

  const buf = await fs.readFile(file);

  if (ext === ".png" && buf.length >= 24) {
    // IHDR は必ず先頭チャンクなので、幅と高さは 16/20 バイト目に固定で入っている
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  if (ext === ".ico" && buf.length >= 8) {
    // ディレクトリエントリの幅・高さは 1 バイト。0 は 256 を意味する
    return { width: buf[6] || 256, height: buf[7] || 256 };
  }

  if (
    ext === ".webp" &&
    buf.length >= 30 &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    const format = buf.toString("ascii", 12, 16);
    if (format === "VP8X") {
      return {
        width: 1 + buf.readUIntLE(24, 3),
        height: 1 + buf.readUIntLE(27, 3),
      };
    }
    if (format === "VP8 ") {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    }
    if (format === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
  }

  return null;
}

/** ミッションアイコンがどのミッションで使われているかをDBから引く */
async function getMissionIconUsage(): Promise<Map<string, string[]>> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("missions")
    .select("title, icon_url, is_hidden")
    .order("title");

  const usage = new Map<string, string[]>();
  if (error) {
    console.error("ミッションアイコンの利用状況の取得に失敗:", error);
    return usage;
  }

  for (const mission of data ?? []) {
    if (!mission.icon_url) continue;
    const label = mission.is_hidden
      ? `${mission.title}（非表示）`
      : mission.title;
    usage.set(mission.icon_url, [
      ...(usage.get(mission.icon_url) ?? []),
      label,
    ]);
  }
  return usage;
}

/**
 * 画像アセットの一覧。
 *
 * カタログ（constants/image-assets.ts）とファイルシステムを突き合わせる。
 * カタログにしか無いものは「ファイルが見つからない」として弾き、
 * ファイルにしか無いものは "unlisted" として出す。どちらの取りこぼしも見えるようにする。
 */
export async function listImageAssets(): Promise<{
  assets: ImageAsset[];
  /** カタログに書いてあるのに実ファイルが無いパス */
  missingFiles: string[];
}> {
  const [files, iconUsage] = await Promise.all([
    walk(PUBLIC_IMG_DIR),
    getMissionIconUsage(),
  ]);

  const catalog = new Map(IMAGE_ASSETS.map((entry) => [entry.path, entry]));
  const assets: ImageAsset[] = [];

  for (const file of files.sort()) {
    const publicPath = `/${path.relative("public", file)}`;
    const [stat, dimensions] = await Promise.all([
      fs.stat(file),
      readDimensions(file).catch(() => null),
    ]);

    const entry = catalog.get(publicPath);
    if (entry) {
      assets.push({ ...entry, bytes: stat.size, dimensions });
      continue;
    }

    if (publicPath.startsWith(MISSION_ICON_PREFIX)) {
      const missions = iconUsage.get(publicPath) ?? [];
      const isDerivedLogo = publicPath.includes("TeamMirai-logo");
      assets.push({
        path: publicPath,
        // actionboard_icon_work_20250713_ol_add-line-friend.svg → add-line-friend
        label: path
          .basename(publicPath, path.extname(publicPath))
          .replace(/^.*_ol_/, ""),
        group: "mission-icon",
        // 派生元のロゴそのものは作り直し。それ以外は青緑を差し替えれば流用できる
        status: isDerivedLogo
          ? "replace"
          : missions.length
            ? "recolor"
            : "keep",
        usedIn: missions.length
          ? missions
          : ["どのミッションからも参照されていない"],
        note: isDerivedLogo
          ? "派生元のロゴそのもの。流用できない。"
          : undefined,
        bytes: stat.size,
        dimensions,
      });
      continue;
    }

    assets.push({
      path: publicPath,
      label: path.basename(publicPath),
      group: "unlisted",
      status: "undecided",
      usedIn: [],
      note: "カタログに未登録。constants/image-assets.ts に追記してください。",
      bytes: stat.size,
      dimensions,
    });
  }

  const found = new Set(assets.map((a) => a.path));
  const missingFiles = IMAGE_ASSETS.filter((e) => !found.has(e.path)).map(
    (e) => e.path,
  );

  return { assets, missingFiles };
}

/**
 * ミッションのOGP画像のうち、外部ホストを直リンクしているもの。
 *
 * 派生元の Supabase Storage を指したままなので、先方が消せば壊れる。
 * 画像を作り直すだけでなく、置き場所も用意する必要がある。
 */
export async function listRemoteOgpImages(): Promise<
  { url: string; missions: string[] }[]
> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("missions")
    .select("title, ogp_image_url, is_hidden")
    .not("ogp_image_url", "is", null);

  if (error) {
    console.error("OGP画像の取得に失敗:", error);
    return [];
  }

  const byUrl = new Map<string, string[]>();
  for (const mission of data ?? []) {
    const url = mission.ogp_image_url;
    if (!url || url.startsWith("/")) continue;
    const label = mission.is_hidden
      ? `${mission.title}（非表示）`
      : mission.title;
    byUrl.set(url, [...(byUrl.get(url) ?? []), label]);
  }

  return Array.from(byUrl, ([url, missions]) => ({ url, missions })).sort(
    (a, b) => a.url.localeCompare(b.url),
  );
}
