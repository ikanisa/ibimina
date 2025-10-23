"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({ open: false, options: { title: "" } });

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const close = (result: boolean) => {
    state.resolve?.(result);
    setState((prev) => ({ ...prev, open: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass w-full max-w-sm rounded-3xl p-6 text-neutral-0">
              <h3 className="text-lg font-semibold">{state.options.title}</h3>
              {state.options.description && (
                <p className="mt-2 text-sm text-neutral-2">{state.options.description}</p>
              )}
              <div className="mt-6 flex justify-end gap-2 text-xs uppercase tracking-[0.3em]">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="interactive-scale rounded-full border border-white/15 px-4 py-2 text-neutral-2"
                >
                  {state.options.cancelLabel ?? "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className="interactive-scale rounded-full bg-kigali px-4 py-2 text-ink shadow-glass"
                >
                  {state.options.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirmDialog must be used within ConfirmProvider");
  return context.confirm;
}
