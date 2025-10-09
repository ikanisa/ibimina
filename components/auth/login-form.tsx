"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BilingualText } from "@/components/common/bilingual-text";

type AuthStep = "credentials" | "enroll" | "challenge";
type EnrollmentState = {
  secret: string;
  secretPreview: string;
  otpauth: string;
  pendingToken: string;
};

interface MfaStatusResponse {
  mfaEnabled: boolean;
  mfaRequired: boolean;
  trustedDevice: boolean;
  methods: string[];
}

export function LoginForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  const [mfaToken, setMfaToken] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "backup">("totp");
  const [rememberDevice, setRememberDevice] = useState(false);
  const qrCodeUrl = useMemo(
    () =>
      enrollment
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(enrollment.otpauth)}`
        : null,
    [enrollment],
  );

  const backupDownload = useMemo(() => {
    if (!backupCodes || backupCodes.length === 0) {
      return null;
    }
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    return URL.createObjectURL(blob);
  }, [backupCodes]);

  useEffect(() => {
    if (!backupDownload) {
      return;
    }
    return () => {
      URL.revokeObjectURL(backupDownload);
    };
  }, [backupDownload]);

  const reset = useCallback(() => {
    setStep("credentials");
    setMessage(null);
    setError(null);
    setEnrollment(null);
    setCodeA("");
    setCodeB("");
    setBackupCodes(null);
    setMfaToken("");
    setMfaMethod("totp");
    setRememberDevice(false);
  }, []);

  const handleCredentialsSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setError(null);
      setEnrollment(null);
      setCodeA("");
      setCodeB("");
      setBackupCodes(null);

      startTransition(async () => {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message ?? "Unable to sign in");
          return;
        }

        if (!data?.session) {
          setError("Unable to establish a session");
          return;
        }

        const statusResponse = await fetch("/api/mfa/status", { cache: "no-store" });
        if (!statusResponse.ok) {
          setError("Unable to verify security requirements");
          return;
        }

        const status = (await statusResponse.json()) as MfaStatusResponse;
        if (!status.mfaRequired) {
          setMessage("Success! Redirecting to dashboard…");
          router.refresh();
          router.push("/dashboard");
          return;
        }

        if (!status.mfaEnabled) {
          const enrollmentResponse = await fetch("/api/mfa/enroll", { method: "POST" });
          if (!enrollmentResponse.ok) {
            setError("Unable to start authenticator setup / Ntibyakunze gutangira gushiraho porogaramu ya Authenticator");
            await supabase.auth.signOut();
            return;
          }

          const data = (await enrollmentResponse.json()) as EnrollmentState;
          setEnrollment({
            secret: data.secret,
            secretPreview: data.secretPreview,
            otpauth: data.otpauth,
            pendingToken: data.pendingToken,
          });
          setStep("enroll");
          setMessage(
            "Scan the QR code or use the secret with Google Authenticator. / Sikana QR cyangwa ukoreshe ijambo rihishe muri Google Authenticator."
          );
          setError(null);
          setCodeA("");
          setCodeB("");
          setMfaToken("");
          setMfaMethod("totp");
          return;
        }

        setStep("challenge");
        setMessage(
          "Enter the 6-digit code from your authenticator app. / Shyiramo kode y'ibiremo 6 iva muri Google Authenticator."
        );
        setError(null);
        setMfaToken("");
        setMfaMethod("totp");
      });
    },
    [email, password, router, supabase],
  );

  const handleMfaSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfaToken) {
        setError("Enter the security code" + " / Shyiramo kode" );
        return;
      }

      startTransition(async () => {
        const response = await fetch("/api/mfa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: mfaToken, method: mfaMethod, rememberDevice }),
        });

        if (!response.ok) {
          const { error: code } = await response.json().catch(() => ({ error: "invalid_code" }));
          if (code === "invalid_code") {
            setError("Invalid code" + " / Kode si yo");
          } else if (code === "rate_limit_exceeded") {
            setError("Too many attempts. Try again later." + " / Wagerageje kenshi, gerageza nyuma" );
          } else {
            setError("Unable to verify authentication code" + " / Ntibyakunze kugenzura kode" );
          }
          return;
        }

        setMessage("Success! Redirecting to dashboard…");
        setError(null);
        setMfaToken("");
        router.refresh();
        router.push("/dashboard");
      });
    },
    [mfaMethod, mfaToken, rememberDevice, router],
  );

  const handleEnrollmentSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!enrollment) {
        setError("Unable to start authenticator setup / Ntibyakunze gutangira gushiraho porogaramu ya Authenticator");
        return;
      }
      if (codeA.length < 6 || codeB.length < 6) {
        setError("Enter two consecutive codes" + " / Shyiramo kode ebyiri zikurikirana");
        return;
      }

      startTransition(async () => {
        const response = await fetch("/api/mfa/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: enrollment.pendingToken, codes: [codeA, codeB] }),
        });

        if (!response.ok) {
          const { error: code } = await response.json().catch(() => ({ error: "unknown" }));
          if (code === "invalid_codes") {
            setError("Authenticator codes were not accepted." + " / Kode zitari zo.");
          } else {
            setError("Unable to confirm enrollment" + " / Ntibyakunze kwemeza kwiyandikisha");
          }
          return;
        }

        const { backupCodes: issuedCodes } = (await response.json()) as { backupCodes: string[] };
        setEnrollment(null);
        setBackupCodes(issuedCodes);
        setCodeA("");
        setCodeB("");
        setMessage(
          "Authenticator verified. Enter the next 6-digit code to finish signing in. / Porogaramu yemejwe, shyiramo indi kode y'ibiremo 6 urangize kwinjira."
        );
        setError(null);
        setStep("challenge");
        setMfaToken("");
        setMfaMethod("totp");
        setRememberDevice(false);
      });
    },
    [codeA, codeB, enrollment, setRememberDevice, startTransition],
  );

  const handleSubmit =
    step === "credentials"
      ? handleCredentialsSubmit
      : step === "enroll"
        ? handleEnrollmentSubmit
        : handleMfaSubmit;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === "credentials" && (
        <>
          <div className="space-y-2 text-left">
            <label htmlFor="email" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText
                primary="Staff email"
                secondary="Imeli y'umukozi"
                layout="inline"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder="staff@sacco.rw / staff@ikimina.rw"
              disabled={pending}
            />
          </div>
          <div className="space-y-2 text-left">
            <label htmlFor="password" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText
                primary="Password"
                secondary="Ijambo ry'ibanga"
                layout="inline"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder="••••••••"
              disabled={pending}
            />
          </div>
        </>
      )}

      {step === "enroll" && enrollment && (
        <>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs text-neutral-2">
            <p className="text-sm text-neutral-0">
              <BilingualText
                primary="Before continuing, add “SACCO+” to the Google Authenticator app."
                secondary="Mbere yo gukomeza, ongeramo “SACCO+” muri porogaramu ya Google Authenticator."
                secondaryClassName="text-[11px] text-neutral-3"
              />
            </p>
            {qrCodeUrl && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4">
                <Image
                  src={qrCodeUrl}
                  alt="Scan this QR code with Google Authenticator to add SACCO+"
                  width={220}
                  height={220}
                  className="h-44 w-44 rounded-lg border border-white/10 bg-neutral-0/5 p-2"
                  priority
                />
                <p className="text-[11px] text-neutral-3 text-center">
                  <BilingualText
                    primary="Open Google Authenticator, tap the + button, and choose “Scan a QR code”."
                    secondary="Fungura Google Authenticator, ukande kuri buto ya +, uhitemo “Scan a QR code”."
                    secondaryClassName="text-[10px] text-neutral-3"
                  />
                </p>
              </div>
            )}
            <div className="space-y-2 text-neutral-2">
              <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li>
                  Open Google Authenticator and tap the <strong>+</strong> button. / Fungura Google
                  Authenticator ukande kuri <strong>+</strong>.
                </li>
                <li>
                  Scan the QR code above <em>or</em> choose “Enter a setup key” and copy the code below.
                  / Sikana QR iri hejuru <em>cyangwa</em> wandike ijambo rihishe riri hepfo ukoresheje
                  “Enter a setup key”.
                </li>
                <li>
                  Give it the name <strong>SACCO+</strong>, confirm, then enter the next two 6-digit codes. /
                  Yite “SACCO+”, wemere hanyuma winjize kode ebyiri zikurikirana z’ibiremo 6.
                </li>
              </ol>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-neutral-0">
              <div className="flex flex-col gap-2">
                <a
                  href={enrollment.otpauth}
                  className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 hover:border-white/30"
                >
                  Open in authenticator app
                </a>
                <p className="text-xs text-neutral-2">
                  <BilingualText
                    primary={
                      <>
                        Secret key: <span className="font-mono text-neutral-0">{enrollment.secret}</span>
                      </>
                    }
                    secondary={
                      <>
                        Ijambo rihishe: <span className="font-mono text-neutral-0">{enrollment.secret}</span>
                      </>
                    }
                    layout="inline"
                    secondaryClassName="text-xs text-neutral-2"
                  />
                </p>
                <p className="text-[10px] text-neutral-3">
                  <BilingualText
                    primary="Enter the next two codes generated after adding the account."
                    secondary="Injiza kode ebyiri zikurikirana zerekanywe nyuma yo kongera konti."
                    secondaryClassName="text-[9px] text-neutral-3"
                  />
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 text-left">
              <label htmlFor="mfa-code-a" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
                <BilingualText
                  primary="Code 1"
                  secondary="Kode 1"
                  layout="inline"
                  secondaryClassName="text-[10px] text-neutral-3"
                />
              </label>
              <input
                id="mfa-code-a"
                inputMode="numeric"
                maxLength={6}
                value={codeA}
                onChange={(event) => setCodeA(event.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                placeholder="123456"
                disabled={pending}
              />
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="mfa-code-b" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
                <BilingualText
                  primary="Code 2"
                  secondary="Kode 2"
                  layout="inline"
                  secondaryClassName="text-[10px] text-neutral-3"
                />
              </label>
              <input
                id="mfa-code-b"
                inputMode="numeric"
                maxLength={6}
                value={codeB}
                onChange={(event) => setCodeB(event.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                placeholder="654321"
                disabled={pending}
              />
            </div>
          </div>
        </>
      )}

      {step === "enroll" && !enrollment && (
        <p className="text-sm text-neutral-2">Preparing authenticator setup…</p>
      )}

      {step === "challenge" && (
        <>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-2">
            <p>
              <BilingualText
                primary="Enter the 6-digit code from your authenticator app."
                secondary="Shyiramo kode y'ibiremo 6 iva muri Google Authenticator."
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </p>
            <p className="text-[10px] text-neutral-3">
              <BilingualText
                primary="Codes rotate every 30 seconds."
                secondary="Kode ihinduka buri masegonda 30."
                secondaryClassName="text-[9px] text-neutral-3"
              />
            </p>
          </div>
          <div className="space-y-2 text-left">
            <label htmlFor="mfa-token" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText
                primary={mfaMethod === "backup" ? "Backup code" : "Authenticator code"}
                secondary={mfaMethod === "backup" ? "Kode y'ingoboka" : "Kode ya Authenticator"}
                layout="inline"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </label>
            <input
              id="mfa-token"
              inputMode={mfaMethod === "backup" ? "text" : "numeric"}
              pattern={mfaMethod === "backup" ? undefined : "[0-9]*"}
              maxLength={mfaMethod === "backup" ? 12 : 6}
              autoFocus
              value={mfaToken}
              onChange={(event) =>
                setMfaToken(
                  mfaMethod === "backup"
                    ? event.target.value.replace(/\s+/g, "").toUpperCase()
                    : event.target.value.replace(/[^0-9]/g, "")
                )
              }
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder={mfaMethod === "backup" ? "ABCD-EFGH" : "123456"}
              disabled={pending}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                className="h-4 w-4 rounded border border-white/20 bg-white/10"
              />
              <BilingualText
                primary="Trust this device for 30 days"
                secondary="Izere iyi mashini iminsi 30"
                layout="inline"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </label>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.3em] text-neutral-2 hover:text-neutral-0"
              onClick={() => {
                setMfaMethod(mfaMethod === "totp" ? "backup" : "totp");
                setMfaToken("");
              }}
            >
              {mfaMethod === "totp" ? "Use backup code" : "Use authenticator"}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-emerald-300">{message}</p>}

      {backupCodes && backupCodes.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
          <div className="flex items-center justify-between">
            <BilingualText
              primary="Backup codes"
              secondary="Kode z'ingoboka"
              secondaryClassName="text-[11px] text-neutral-3"
            />
            {backupDownload && (
              <a
                href={backupDownload}
                download="backup-codes.txt"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 hover:border-white/30"
              >
                Download
              </a>
            )}
          </div>
          <p className="text-[10px] text-neutral-3">
            <BilingualText
              primary="Store these codes securely. Each one can be used once if you lose access to the authenticator app."
              secondary="Bika izi kode ahantu hizewe, buri imwe ikoreshwa rimwe gusa mu gihe wabuze porogaramu ya Authenticator."
              secondaryClassName="text-[9px] text-neutral-3"
            />
          </p>
          <ul className="grid gap-2 md:grid-cols-2">
            {backupCodes.map((code) => (
              <li key={code} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 font-mono text-neutral-0">
                {code}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        className="interactive-scale w-full rounded-full bg-kigali px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-50"
        disabled={pending}
      >
        {pending
          ? "Processing…"
          : step === "credentials"
            ? "Sign in"
            : step === "enroll"
              ? "Confirm setup"
              : "Verify code"}
      </button>

      {step !== "credentials" && (
        <button
          type="button"
          className="w-full text-center text-xs text-neutral-2 hover:text-neutral-0"
          onClick={reset}
        >
          Cancel and sign in again
        </button>
      )}
    </form>
  );
}
