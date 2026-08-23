"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/auth/google-icon";
import { useState } from "react";

export function GoogleAuthButton({ label }: { label: string }) {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="flex flex-col gap-2.5">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setShowNotice(true)}
        className="gap-2.5 font-medium"
      >
        <GoogleIcon className="h-4 w-4" />
        {label}
      </Button>
      {showNotice && <Alert variant="muted">Google sign-in isn&apos;t available yet — use email and password for now.</Alert>}
    </div>
  );
}
