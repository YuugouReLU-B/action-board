import Image from "next/image";
import type { Message } from "@/components/common/form-message";
import TwoStepSignUpForm from "@/features/auth/components/two-step-sign-up-form";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex-1 flex flex-col min-w-72">
      <div className="flex justify-center items-center m-4">
        <Image
          src="/img/logo.png"
          alt="浜通りクエスト"
          width={96}
          height={96}
        />
      </div>
      <TwoStepSignUpForm searchParams={searchParams} />
    </div>
  );
}
