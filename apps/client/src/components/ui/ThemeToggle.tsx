"use client";

import { useLocaleMessages } from "@/src/hooks/useLocaleMessages";
import { useUIStore } from "@/src/state/ui-store";

import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();
  const nextTheme = theme === "light" ? "dark" : "light";
  const messages = useLocaleMessages();
  const label = theme === "light" ? messages.theme.dark : messages.theme.light;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
    >
      <span className={styles.icon} aria-hidden="true">
        {theme === "light" ? "🌙" : "☀️"}
      </span>
      <span>{label}</span>
    </button>
  );
}
