import Image from "next/image";

type HeroBackdropProps = {
  /**
   * ぼかして背景に沈める。カードやテキストを重ねる面で使う。
   * ぼかすと端が透けるので scale で少し外へ逃がしている。
   */
  blur?: boolean;
  /** ファーストビューに出る面だけ true にする */
  priority?: boolean;
  /** 画像の上に重ねるスクリム。可読性の要求が面ごとに違うので呼び出し側で決める */
  overlayClassName?: string;
};

/**
 * 浜通りの風景を敷く共通の背景。トップ（未ログイン・ログイン後）とフッターで使う。
 *
 * 画像は 1742×903 を object-cover で敷いているため、狭い画面では左右が切れる。
 */
export function HeroBackdrop({
  blur = false,
  priority = false,
  overlayClassName,
}: HeroBackdropProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/img/hero.webp"
        alt=""
        fill
        sizes="100vw"
        priority={priority}
        className={`object-cover object-bottom ${blur ? "blur-md scale-110" : ""}`}
      />
      {overlayClassName && (
        <div className={`absolute inset-0 ${overlayClassName}`} />
      )}
    </div>
  );
}
