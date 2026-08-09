"use client";

import { startLineLogin } from "@/features/auth/actions/start-line-login";

/**
 * LINEログイン開始関数
 *
 * state の生成と保存、authorize URL の組み立てはサーバー側（startLineLogin）で行う。
 * クライアントは返ってきた URL に遷移するだけ。
 * 以前は localStorage に state を置いてクライアントで照合していたが、
 * サーバー側の検証を素通りできる構造だったため HttpOnly cookie 方式に変更した。
 */
export async function signInWithLine(returnUrl?: string, dateOfBirth?: string) {
  const result = await startLineLogin({ returnUrl, dateOfBirth });

  if (!result.success) {
    throw new Error(result.error);
  }

  window.location.href = result.authorizeUrl;
}
