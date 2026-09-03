"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { startMfaSetup, confirmMfaSetup, disableMfa } from "./mfa-actions";

export function MfaSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [setup, setSetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDisable, setShowDisable] = useState(false);

  function beginSetup() {
    setError(null);
    startTransition(async () => {
      const res = await startMfaSetup();
      if (res.ok) setSetup({ secret: res.secret, qrCodeDataUrl: res.qrCodeDataUrl });
      else setError(res.error);
    });
  }

  function confirm() {
    if (!setup) return;
    setError(null);
    startTransition(async () => {
      const res = await confirmMfaSetup(setup.secret, code);
      if (res.ok) {
        setEnabled(true);
        setSetup(null);
        setCode("");
      } else {
        setError(res.error ?? "Could not confirm MFA.");
      }
    });
  }

  function handleDisable() {
    setError(null);
    startTransition(async () => {
      const res = await disableMfa(password);
      if (res.ok) {
        setEnabled(false);
        setShowDisable(false);
        setPassword("");
      } else {
        setError(res.error ?? "Could not disable MFA.");
      }
    });
  }

  if (enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink">Two-factor authentication</span>
          <Badge tone="success">Enabled</Badge>
        </div>
        {!showDisable ? (
          <Button size="sm" variant="outline" onClick={() => setShowDisable(true)}>
            Disable
          </Button>
        ) : (
          <div className="space-y-3 rounded border border-ink/10 p-4">
            <Label htmlFor="disablePassword">Confirm your password to disable</Label>
            <Input id="disablePassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="font-mono text-xs text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={handleDisable} isLoading={pending}>
                Confirm disable
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDisable(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (setup) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-steel">Scan this code with an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code it shows.</p>
        <Image src={setup.qrCodeDataUrl} alt="MFA QR code" width={180} height={180} className="rounded border border-ink/10" unoptimized />
        <p className="font-mono text-xs text-steel">Can't scan? Enter manually: {setup.secret}</p>
        <div>
          <Label htmlFor="mfaCode">6-digit code</Label>
          <Input id="mfaCode" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </div>
        {error && <p className="font-mono text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={confirm} isLoading={pending} disabled={code.length !== 6}>
            Confirm &amp; enable
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSetup(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink">Two-factor authentication</span>
      <Button size="sm" variant="outline" onClick={beginSetup} isLoading={pending}>
        Enable
      </Button>
    </div>
  );
}
