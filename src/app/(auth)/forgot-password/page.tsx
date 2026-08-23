import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <AuthShell quote="Let your work speak — the AI handles the rest.">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint text-xl">
          🚧
        </div>
        <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">
          Password reset is coming soon
        </h1>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted">
          This journey is still being built. In the meantime, contact an admin if you&apos;re
          locked out of your account.
        </p>
        <Link
          href="/login"
          className="mt-6 text-[13px] font-semibold text-accent hover:text-accent-hover"
        >
          ← Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
