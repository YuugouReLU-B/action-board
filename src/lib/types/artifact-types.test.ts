import { describe, expect, test } from "@jest/globals";
import { ARTIFACT_TYPES, getArtifactConfig } from "./artifact-types";

describe("getArtifactConfig", () => {
  describe("有効なアーティファクトタイプ", () => {
    test.each([
      "LINK",
      "TEXT",
      "EMAIL",
      "IMAGE",
      "IMAGE_WITH_GEOLOCATION",
      "REFERRAL",
      "POSTING",
      "POSTER",
      "QUIZ",
      "LINK_ACCESS",
      "NONE",
    ] as const)("%s の設定を正しく返す", (typeKey) => {
      const config = getArtifactConfig(typeKey);
      expect(config).toBe(ARTIFACT_TYPES[typeKey]);
    });
  });

  describe("各タイプの設定内容を検証", () => {
    test("LINK は displayName, prompt, validationRegex を持つ", () => {
      const config = getArtifactConfig("LINK");
      expect(config).toEqual(
        expect.objectContaining({
          key: "LINK",
          displayName: "リンク",
          prompt: expect.any(String),
          validationRegex: expect.any(RegExp),
        }),
      );
    });

    test("IMAGE は allowedMimeTypes と maxFileSizeMB を持つ", () => {
      const config = getArtifactConfig("IMAGE");
      expect(config).toEqual(
        expect.objectContaining({
          key: "IMAGE",
          displayName: "画像",
          allowedMimeTypes: expect.any(Array),
          maxFileSizeMB: 10,
        }),
      );
    });

    test("IMAGE_WITH_GEOLOCATION は allowedMimeTypes と maxFileSizeMB を持つ", () => {
      const config = getArtifactConfig("IMAGE_WITH_GEOLOCATION");
      expect(config).toEqual(
        expect.objectContaining({
          key: "IMAGE_WITH_GEOLOCATION",
          displayName: "画像および位置情報",
          allowedMimeTypes: expect.any(Array),
          maxFileSizeMB: 10,
        }),
      );
    });

    test("NONE は添付データ不要の設定を持つ", () => {
      const config = getArtifactConfig("NONE");
      expect(config).toEqual(
        expect.objectContaining({
          key: "NONE",
          displayName: "添付データ不要",
        }),
      );
    });
  });

  describe("無効な入力", () => {
    test("undefined の場合は NONE の設定を返す", () => {
      const config = getArtifactConfig(undefined);
      expect(config).toBe(ARTIFACT_TYPES.NONE);
    });

    test("null の場合は NONE の設定を返す", () => {
      const config = getArtifactConfig(null);
      expect(config).toBe(ARTIFACT_TYPES.NONE);
    });

    test("空文字の場合は NONE の設定を返す", () => {
      const config = getArtifactConfig("");
      expect(config).toBe(ARTIFACT_TYPES.NONE);
    });

    test("存在しないタイプキーの場合は NONE の設定を返す", () => {
      const config = getArtifactConfig("INVALID_TYPE");
      expect(config).toBe(ARTIFACT_TYPES.NONE);
    });
  });
});
