import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export function Input({ label, helperText, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-neutral-0">
      {label && <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">{label}</span>}
      <input
        {...props}
        className={cn(
          "rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue",
          className
        )}
      />
      {helperText && <span className="text-[11px] text-neutral-2">{helperText}</span>}
    </label>
  );
}
