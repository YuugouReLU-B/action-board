import { listAppRoutes, segmentsToRoute } from "./route-inventory";

describe("segmentsToRoute", () => {
  it("セグメントなしはルートパスになる", () => {
    expect(segmentsToRoute([])).toBe("/");
  });

  it("セグメントを / で連結する", () => {
    expect(segmentsToRoute(["missions", "[slug]"])).toBe("/missions/[slug]");
  });

  it("ルートグループは URL に現れない", () => {
    expect(segmentsToRoute(["(protected)", "settings", "profile"])).toBe(
      "/settings/profile",
    );
  });

  it("ルートグループのみならルートパスになる", () => {
    expect(segmentsToRoute(["(auth-pages)"])).toBe("/");
  });
});

describe("listAppRoutes", () => {
  const routes = listAppRoutes();

  it("ルートを検出する", () => {
    expect(routes.length).toBeGreaterThan(10);
  });

  it("ルートパスの昇順で並んでいる", () => {
    const sorted = [...routes].sort((a, b) => a.route.localeCompare(b.route));
    expect(routes).toEqual(sorted);
  });

  it("トップページを含む", () => {
    expect(routes.map((entry) => entry.route)).toContain("/");
  });

  it("動的ルートに dynamicSegments が入る", () => {
    const missionDetail = routes.find(
      (entry) => entry.route === "/missions/[slug]",
    );

    expect(missionDetail).toMatchObject({
      isDynamic: true,
      dynamicSegments: ["slug"],
    });
  });

  it("(protected) 配下は isProtected になる", () => {
    const profile = routes.find((entry) => entry.route === "/settings/profile");

    expect(profile).toMatchObject({
      isProtected: true,
      groups: ["(protected)"],
    });
  });

  it("ルートグループ外のページは isProtected にならない", () => {
    const top = routes.find((entry) => entry.route === "/");

    expect(top?.isProtected).toBe(false);
  });

  it("file はリポジトリ相対の page ファイルを指す", () => {
    for (const entry of routes) {
      expect(entry.file.startsWith("src/app")).toBe(true);
      expect(entry.file).toMatch(/page\.(tsx?|jsx?)$/);
    }
  });

  it("同じルートが重複しない", () => {
    const paths = routes.map((entry) => entry.route);
    expect(paths).toHaveLength(new Set(paths).size);
  });
});
