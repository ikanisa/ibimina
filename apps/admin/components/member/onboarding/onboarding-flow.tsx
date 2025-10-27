"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, FileUp, Loader2 } from "lucide-react";

interface OcrResult {
  name: string | null;
  idNumber: string | null;
  dob: string | null;
  sex: string | null;
  address: string | null;
}

interface OnboardingPayload {
  whatsapp_msisdn: string;
  momo_msisdn: string;
  ocr_json?: OcrResult | null;
}

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ whatsapp_msisdn: "", momo_msisdn: "" });
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [isSubmitting, startSubmit] = useTransition();
  const router = useRouter();

  const steps = useMemo(
    () => [
      {
        title: "Contact numbers",
        description: "Enter the WhatsApp and MoMo numbers you want to use.",
        content: (
          <div className="space-y-4">
            <Field
              label="WhatsApp number"
              placeholder="e.g. +2507…"
              value={form.whatsapp_msisdn}
              onChange={(value) => setForm((prev) => ({ ...prev, whatsapp_msisdn: value }))}
            />
            <Field
              label="MoMo number"
              placeholder="e.g. +2507…"
              value={form.momo_msisdn}
              onChange={(value) => setForm((prev) => ({ ...prev, momo_msisdn: value }))}
            />
          </div>
        ),
      },
      {
        title: "Identity document",
        description: "Upload a clear photo of your ID.",
        content: <DocumentUploader onUploaded={setOcr} />,
      },
      {
        title: "Review",
        description: "Confirm your details before finishing onboarding.",
        content: <ReviewPanel form={form} ocr={ocr} />,
      },
    ],
    [form, ocr]
  );

  const nextDisabled =
    (step === 0 && (!form.whatsapp_msisdn || !form.momo_msisdn)) || (step === 1 && !ocr);

  const submit = () => {
    startSubmit(async () => {
      const response = await fetch("/api/member/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ocr_json: ocr }),
      });

      if (!response.ok) {
        console.error("Failed to submit onboarding");
        return;
      }

      router.push("/member");
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-neutral-0">
        <p className="text-sm uppercase tracking-wide text-white/70">
          Step {step + 1} of {steps.length}
        </p>
        <h1 className="text-3xl font-semibold">{steps[step].title}</h1>
        <p className="text-base text-white/80">{steps[step].description}</p>
      </header>

      <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-neutral-0 shadow-glass">
        {steps[step].content}
      </div>

      <footer className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold text-neutral-0 transition-all duration-interactive ease-interactive hover:bg-white/25 disabled:opacity-50"
          onClick={() => setStep((index) => Math.max(0, index - 1))}
          disabled={step === 0 || isSubmitting}
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="rounded-2xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-neutral-0 transition-all duration-interactive ease-interactive hover:bg-emerald-500 disabled:opacity-60"
            onClick={() => setStep((index) => Math.min(steps.length - 1, index + 1))}
            disabled={nextDisabled}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl bg-emerald-500/80 px-5 py-2 text-sm font-semibold text-neutral-0 transition-all duration-interactive ease-interactive hover:bg-emerald-500 disabled:opacity-60"
            onClick={submit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            )}
            Finish onboarding
          </button>
        )}
      </footer>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function Field({ label, value, placeholder, onChange }: FieldProps) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-semibold text-white/80">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-base text-neutral-0 focus:border-emerald-400 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

interface DocumentUploaderProps {
  onUploaded: (result: OcrResult | null) => void;
}

function DocumentUploader({ onUploaded }: DocumentUploaderProps) {
  const [isUploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<OcrResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = (file: File | null) => {
    if (!file) {
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append("document", file);

    startUpload(async () => {
      const response = await fetch("/api/member/ocr/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to upload document");
        setError("Upload failed. Try again.");
        setPreview(null);
        onUploaded(null);
        return;
      }

      const data = (await response.json()) as { ocr: OcrResult };
      setPreview(data.ocr);
      onUploaded(data.ocr);
    });
  };

  return (
    <div className="space-y-4 text-neutral-0">
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/30 bg-white/5 p-8 text-center">
        <Camera className="h-10 w-10" aria-hidden />
        <span className="text-lg font-semibold">Capture or upload your ID</span>
        <span className="text-sm text-white/70">
          We support National ID, Driver’s License, or Passport.
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white/12 px-4 py-2 text-sm font-semibold text-neutral-0 transition-all duration-interactive ease-interactive hover:bg-white/18"
        >
          <FileUp className="h-4 w-4" aria-hidden /> Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => upload(event.target.files?.[0] ?? null)}
        />
      </div>
      {isUploading ? (
        <p className="flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Processing document…
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      <Preview ocr={preview} />
    </div>
  );
}

interface ReviewPanelProps {
  form: OnboardingPayload;
  ocr: OcrResult | null;
}

function ReviewPanel({ form, ocr }: ReviewPanelProps) {
  return (
    <div className="space-y-4 text-neutral-0">
      <section>
        <h3 className="text-lg font-semibold">Contact</h3>
        <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-white/70">WhatsApp</dt>
            <dd className="text-base font-semibold">{form.whatsapp_msisdn || "—"}</dd>
          </div>
          <div>
            <dt className="text-white/70">MoMo</dt>
            <dd className="text-base font-semibold">{form.momo_msisdn || "—"}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3 className="text-lg font-semibold">Identity</h3>
        {ocr ? (
          <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-white/70">Name</dt>
              <dd className="text-base font-semibold">{ocr.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/70">ID number</dt>
              <dd className="text-base font-semibold">{ocr.idNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/70">Date of birth</dt>
              <dd className="text-base font-semibold">{ocr.dob ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/70">Sex</dt>
              <dd className="text-base font-semibold">{ocr.sex ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-white/70">Address</dt>
              <dd className="text-base font-semibold">{ocr.address ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-white/70">
            Upload an ID document to see the extracted fields.
          </p>
        )}
      </section>
    </div>
  );
}

function Preview({ ocr }: { ocr: OcrResult | null }) {
  if (!ocr) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-white/6 p-4 text-sm text-neutral-0">
      <p className="font-semibold">Detected information</p>
      <ul className="mt-2 space-y-1 text-white/80">
        <li>Name: {ocr.name ?? "—"}</li>
        <li>ID: {ocr.idNumber ?? "—"}</li>
        <li>DOB: {ocr.dob ?? "—"}</li>
        <li>Sex: {ocr.sex ?? "—"}</li>
        <li>Address: {ocr.address ?? "—"}</li>
      </ul>
    </div>
  );
}
