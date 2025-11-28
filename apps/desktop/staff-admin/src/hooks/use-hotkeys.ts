import { useEffect, useCallback } from 'react';

interface Hotkey {
  keys: string[];
  action: () => void;
}

export function useHotkeys(hotkeys: Hotkey[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const hotkey of hotkeys) {
      const keysMatch = hotkey.keys.every(key => {
        if (key === 'Meta') return event.metaKey || event.ctrlKey;
        if (key === 'Shift') return event.shiftKey;
        if (key === 'Alt') return event.altKey;
        if (key === 'Ctrl') return event.ctrlKey;
        if (key === 'Escape') return event.key === 'Escape';
        return event.key.toLowerCase() === key.toLowerCase();
      });

      if (keysMatch) {
        event.preventDefault();
        hotkey.action();
        break;
      }
    }
  }, [hotkeys]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
