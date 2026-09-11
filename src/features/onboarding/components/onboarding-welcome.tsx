import Image from "next/image";

/**
 * オンボーディングウェルカム画面コンポーネント
 * ロゴと浜通りクエストテキストを表示
 */
export const OnboardingWelcome: React.FC = () => {
  return (
    <div className="absolute top-20 md:top-16 lg:top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4">
      {/* ロゴ */}
      <div className="relative w-[40vw] h-[40vw] min-[390px]:w-[48vw] min-[390px]:h-[48vw] min-[430px]:w-[56vw] min-[430px]:h-[56vw] sm:w-[36vw] sm:h-[36vw] md:w-[20vw] md:h-[20vw] lg:w-[16vw] lg:h-[16vw] max-w-48 max-h-48">
        <Image
          src="/img/logo.png"
          alt="浜通りクエスト"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
};
