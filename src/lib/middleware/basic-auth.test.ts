/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import {
  createUnauthorizedResponse,
  parseBasicAuthHeader,
  resolveBasicAuthResponse,
} from "./basic-auth";

function createRequest(authorization?: string): NextRequest {
  const headers = new Headers();
  if (authorization !== undefined) {
    headers.set("authorization", authorization);
  }
  return new NextRequest(new URL("/", "http://localhost:3000"), { headers });
}

function basicHeader(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

describe("parseBasicAuthHeader", () => {
  it("Basic ヘッダーを user / password に分解する", () => {
    expect(parseBasicAuthHeader(basicHeader("hama", "quest"))).toEqual({
      user: "hama",
      password: "quest",
    });
  });

  it("パスワードに含まれる : は分割しない", () => {
    expect(parseBasicAuthHeader(basicHeader("hama", "a:b:c"))).toEqual({
      user: "hama",
      password: "a:b:c",
    });
  });

  it("ヘッダーが無い場合は null", () => {
    expect(parseBasicAuthHeader(null)).toBeNull();
  });

  it("Basic 以外のスキームは null", () => {
    expect(parseBasicAuthHeader("Bearer token")).toBeNull();
  });

  it("base64 として壊れている場合は null", () => {
    expect(parseBasicAuthHeader("Basic ****")).toBeNull();
  });

  it("区切りの : が無い場合は null", () => {
    expect(
      parseBasicAuthHeader(
        `Basic ${Buffer.from("nocolon").toString("base64")}`,
      ),
    ).toBeNull();
  });
});

describe("createUnauthorizedResponse", () => {
  it("401 と WWW-Authenticate を返す", () => {
    const response = createUnauthorizedResponse();
    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain("Basic realm=");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("resolveBasicAuthResponse", () => {
  const originalUser = process.env.BASIC_AUTH_USER;
  const originalPassword = process.env.BASIC_AUTH_PASSWORD;

  beforeEach(() => {
    // .env の値が漏れてくるとテストの前提が崩れるので毎回消す
    delete process.env.BASIC_AUTH_USER;
    delete process.env.BASIC_AUTH_PASSWORD;
  });

  afterAll(() => {
    process.env.BASIC_AUTH_USER = originalUser;
    process.env.BASIC_AUTH_PASSWORD = originalPassword;
  });

  it("環境変数が未設定なら素通しする", () => {
    expect(resolveBasicAuthResponse(createRequest())).toBeNull();
  });

  it("ユーザー名だけ設定されていても素通しする", () => {
    process.env.BASIC_AUTH_USER = "hama";
    expect(resolveBasicAuthResponse(createRequest())).toBeNull();
  });

  it("パスワードだけ設定されていても素通しする", () => {
    process.env.BASIC_AUTH_PASSWORD = "quest";
    expect(resolveBasicAuthResponse(createRequest())).toBeNull();
  });

  it("設定済みで認証情報が無ければ 401", () => {
    process.env.BASIC_AUTH_USER = "hama";
    process.env.BASIC_AUTH_PASSWORD = "quest";
    expect(resolveBasicAuthResponse(createRequest())?.status).toBe(401);
  });

  it("正しい認証情報なら素通しする", () => {
    process.env.BASIC_AUTH_USER = "hama";
    process.env.BASIC_AUTH_PASSWORD = "quest";
    expect(
      resolveBasicAuthResponse(createRequest(basicHeader("hama", "quest"))),
    ).toBeNull();
  });

  it("パスワードが違えば 401", () => {
    process.env.BASIC_AUTH_USER = "hama";
    process.env.BASIC_AUTH_PASSWORD = "quest";
    expect(
      resolveBasicAuthResponse(createRequest(basicHeader("hama", "wrong")))
        ?.status,
    ).toBe(401);
  });

  it("ユーザー名が違えば 401", () => {
    process.env.BASIC_AUTH_USER = "hama";
    process.env.BASIC_AUTH_PASSWORD = "quest";
    expect(
      resolveBasicAuthResponse(createRequest(basicHeader("other", "quest")))
        ?.status,
    ).toBe(401);
  });

  it("前方一致するだけの短いパスワードは通さない", () => {
    process.env.BASIC_AUTH_USER = "hama";
    process.env.BASIC_AUTH_PASSWORD = "quest";
    expect(
      resolveBasicAuthResponse(createRequest(basicHeader("hama", "que")))
        ?.status,
    ).toBe(401);
  });
});
