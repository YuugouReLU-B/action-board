import Image from "next/image";
import Link from "next/link";
import { FOOTER_IMAGE_SIZES } from "./footer";

export function LogoSection() {
  return (
    <div className="pt-8">
      <div className="px-4 md:container md:mx-auto text-center">
        <Link href="/" className="inline-block">
          <Image
            src="/img/logo.png"
            alt="浜通りクエスト"
            width={FOOTER_IMAGE_SIZES.logo.width}
            height={FOOTER_IMAGE_SIZES.logo.height}
            className="mx-auto"
          />
        </Link>
      </div>
    </div>
  );
}
