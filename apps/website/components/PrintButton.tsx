"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="glass px-6 py-3 font-semibold hover:bg-white/20 transition-all"
    >
      Print Instructions
    </button>
  );
}
