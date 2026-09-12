"use client";

// 複数のマップ表示から呼ばれても、スクリプトの読み込みは1回だけにする
let loaderPromise: Promise<void> | null = null;

/**
 * Google Maps JavaScript APIをブラウザに読み込む。
 *
 * 既に読み込み済み、または読み込み中ならその結果を使い回す。
 */
export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("loadGoogleMaps はブラウザでのみ動作します"),
    );
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const callbackName = "__hamadoriGoogleMapsLoaded";

    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("Google Mapsの読み込みに失敗しました"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
