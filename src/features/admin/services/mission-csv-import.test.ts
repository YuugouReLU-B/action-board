import { parseMissionCsv } from "./mission-csv-import";

describe("parseMissionCsv", () => {
  it("QRミッションの有効な行を正しくパースする", () => {
    const csv = [
      "slug,title,content,required_artifact_type,points,difficulty,event_date,latitude,longitude,radius_meters,icon_url,category_slug,is_featured,is_hidden",
      "event-a,イベントA,会場QR,QR,200,1,2026-10-04,,,,,attend-events,false,false",
    ].join("\n");

    const rows = parseMissionCsv(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].data).toMatchObject({
      slug: "event-a",
      title: "イベントA",
      required_artifact_type: "QR",
      points: 200,
      difficulty: 1,
    });
    expect(rows[0].categorySlug).toBe("attend-events");
  });

  it("GEO_CHECKINで緯度経度・半径が欠けているとエラーになる", () => {
    const csv = [
      "slug,title,content,required_artifact_type,points,difficulty,event_date,latitude,longitude,radius_meters,icon_url,category_slug,is_featured,is_hidden",
      "spot-a,スポットA,,GEO_CHECKIN,100,1,,,,,,visit-checkpoints,false,false",
    ].join("\n");

    const rows = parseMissionCsv(csv);

    expect(rows[0].data).toBeNull();
    expect(rows[0].errors.join(" ")).toContain(
      "位置情報チェックインには緯度・経度・判定半径がすべて必要です",
    );
  });

  it("QR/GEO_CHECKIN以外のrequired_artifact_typeはエラーになる", () => {
    const csv = [
      "slug,title,content,required_artifact_type,points,difficulty,event_date,latitude,longitude,radius_meters,icon_url,category_slug,is_featured,is_hidden",
      "link-mission,リンクミッション,,LINK,100,1,,,,,,attend-events,false,false",
    ].join("\n");

    const rows = parseMissionCsv(csv);

    expect(rows[0].data).toBeNull();
    expect(
      rows[0].errors.some((e) => e.includes("QRまたはGEO_CHECKIN")),
    ).toBe(true);
  });

  it("category_slugが空だとエラーになる", () => {
    const csv = [
      "slug,title,content,required_artifact_type,points,difficulty,event_date,latitude,longitude,radius_meters,icon_url,category_slug,is_featured,is_hidden",
      "event-a,イベントA,,QR,200,1,,,,,,,false,false",
    ].join("\n");

    const rows = parseMissionCsv(csv);

    expect(rows[0].data).toBeNull();
    expect(rows[0].errors).toContain("category_slugは必須です");
  });

  it("slugが空だとエラーになる", () => {
    const csv = [
      "slug,title,content,required_artifact_type,points,difficulty,event_date,latitude,longitude,radius_meters,icon_url,category_slug,is_featured,is_hidden",
      ",イベントA,,QR,200,1,,,,,,attend-events,false,false",
    ].join("\n");

    const rows = parseMissionCsv(csv);

    expect(rows[0].data).toBeNull();
    expect(rows[0].errors.length).toBeGreaterThan(0);
  });

  it("複数行を行番号付きで処理する", () => {
    const csv = [
      "slug,title,content,required_artifact_type,points,difficulty,event_date,latitude,longitude,radius_meters,icon_url,category_slug,is_featured,is_hidden",
      "event-a,イベントA,,QR,200,1,,,,,,attend-events,false,false",
      "event-b,イベントB,,QR,200,1,,,,,,attend-events,false,false",
    ].join("\n");

    const rows = parseMissionCsv(csv);

    expect(rows).toHaveLength(2);
    expect(rows[0].rowNumber).toBe(2);
    expect(rows[1].rowNumber).toBe(3);
  });
});
