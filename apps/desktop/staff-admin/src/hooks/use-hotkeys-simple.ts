/**
 * Hotkeys hook for desktop shortcuts
 */

import { useEffect } from 'react';

interface HotkeyConfig {
  keys: string[];
  action: () => void;
}

export function useHotkeys(configs: HotkeyConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const config of configs) {
        const keysPressed = config.keys.every((key) => {
          if (key === 'Meta') return e.metaKey || e.ctrlKey;
          if (key === 'Shift') return e.shiftKey;
          if (key === 'Alt') return e.altKey;
          if (key === 'Ctrl') return e.ctrlKey;
          return e.key.toLowerCase() === key.toLowerCase();
        });

        if (keysPressed) {
          e.preventDefault();
          config.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [configs]);
}
