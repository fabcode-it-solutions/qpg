import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { SpinnerIcon } from "@/components/icons";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <SpinnerIcon size={48} className="text-(--color-gold) mx-auto mb-4" />
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
