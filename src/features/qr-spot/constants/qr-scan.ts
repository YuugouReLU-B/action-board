/**
 * QRが指すパス。`/q/<code>`
 *
 * クライアント側のスキャナからも参照するので、`server-only` を付けた
 * サービス層ではなくここに置く。
 */
export const QR_SCAN_PATH = "/q";

/** アプリ内のQR読み取り画面 */
export const SCAN_PATH = "/scan";
