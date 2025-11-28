'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  textScaling: number;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  cursorSize: 'normal' | 'large' | 'extra-large';
  screenReader: boolean;
  soundEffects: boolean;
  voiceFeedback: boolean;
  keyboardNavigation: boolean;
  stickyKeys: boolean;
  slowKeys: boolean;
  slowKeysDelay: number;
  focusIndicator: 'default' | 'enhanced' | 'high-visibility';
  simplifiedUI: boolean;
  readingGuide: boolean;
  dyslexiaFont: boolean;
  lineSpacing: number;
  wordSpacing: number;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  focusMain: () => void;
  skipToContent: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  textScaling: 1.0,
  colorBlindMode: 'none',
  cursorSize: 'normal',
  screenReader: false,
  soundEffects: true,
  voiceFeedback: false,
  keyboardNavigation: true,
  stickyKeys: false,
  slowKeys: false,
  slowKeysDelay: 300,
  focusIndicator: 'default',
  simplifiedUI: false,
  readingGuide: false,
  dyslexiaFont: false,
  lineSpacing: 1.5,
  wordSpacing: 0,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [announcer, setAnnouncer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('accessibility-settings');
        if (saved) {
          setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
        }
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setSettings(prev => ({ ...prev, reducedMotion: true }));
      }
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        setSettings(prev => ({ ...prev, highContrast: true }));
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.style.fontSize = `${settings.textScaling * 16}px`;
    body.classList.toggle('high-contrast', settings.highContrast);
    body.classList.toggle('reduced-motion', settings.reducedMotion);
    body.classList.toggle('large-text', settings.largeText);

    body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (settings.colorBlindMode !== 'none') {
      body.classList.add(settings.colorBlindMode);
    }

    body.classList.remove('cursor-large', 'cursor-extra-large');
    if (settings.cursorSize !== 'normal') {
      body.classList.add(`cursor-${settings.cursorSize}`);
    }

    body.classList.remove('focus-enhanced', 'focus-high-visibility');
    if (settings.focusIndicator !== 'default') {
      body.classList.add(`focus-${settings.focusIndicator}`);
    }

    body.classList.toggle('simplified-ui', settings.simplifiedUI);
    body.classList.toggle('dyslexia-font', settings.dyslexiaFont);
    body.classList.toggle('reading-guide', settings.readingGuide);

    root.style.setProperty('--a11y-line-height', `${settings.lineSpacing}`);
    root.style.setProperty('--a11y-word-spacing', `${settings.wordSpacing}em`);
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save accessibility settings:', error);
      }
      return newSettings;
    });
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer) return;

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);

    if (settings.voiceFeedback && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.1;
      speechSynthesis.speak(utterance);
    }
  }, [announcer, settings.voiceFeedback]);

  const focusMain = useCallback(() => {
    const main = document.querySelector('main');
    if (main) {
      (main as HTMLElement).focus();
      announce('Main content focused');
    }
  }, [announce]);

  const skipToContent = useCallback(() => {
    const content = document.getElementById('main-content');
    if (content) {
      content.tabIndex = -1;
      content.focus();
      announce('Skipped to main content');
    }
  }, [announce]);

  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        skipToContent();
      }

      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        focusMain();
      }

      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        updateSettings({ highContrast: !settings.highContrast });
        announce(settings.highContrast ? 'High contrast disabled' : 'High contrast enabled');
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        const newScale = Math.min(2, settings.textScaling + 0.1);
        updateSettings({ textScaling: newScale });
        announce(`Text size ${Math.round(newScale * 100)}%`);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        const newScale = Math.max(0.5, settings.textScaling - 0.1);
        updateSettings({ textScaling: newScale });
        announce(`Text size ${Math.round(newScale * 100)}%`);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        updateSettings({ textScaling: 1.0 });
        announce('Text size reset to 100%');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, updateSettings, announce, focusMain, skipToContent]);

  return (
    <AccessibilityContext.Provider value={{
      settings,
      updateSettings,
      announce,
      focusMain,
      skipToContent,
    }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
        onClick={(e) => {
          e.preventDefault();
          skipToContent();
        }}
      >
        Skip to main content
      </a>

      <div
        ref={setAnnouncer}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {settings.readingGuide && <ReadingGuide />}

      {children}
    </AccessibilityContext.Provider>
  );
}

function ReadingGuide() {
  const [position, setPosition] = useState({ y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="fixed inset-x-0 h-8 bg-yellow-200/30 pointer-events-none z-[9998] transition-transform duration-75"
      style={{ transform: `translateY(${position.y - 16}px)` }}
    />
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
