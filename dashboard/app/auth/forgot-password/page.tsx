import { ForgotPasswordForm } from "@/components/forgot-password-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/ui/copilot_logo.png"
            alt="COPilot Logo"
            width={250}
            height={100}
            className="rounded-lg mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to reset your password
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
