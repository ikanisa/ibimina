'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { VoiceCommandSystem } from '@/lib/ai/voice-commands';
import { 
  Settings, 
  Eye, 
  Ear, 
  Hand, 
  Brain, 
  Mic,
  Volume2,
  Moon,
  Sun,
  Type,
  Contrast,
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useAccessibility();
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const toggleVoice = () => {
    if (!voiceEnabled) {
      const voiceSystem = new VoiceCommandSystem();
      if (voiceSystem.isSupported()) {
        voiceSystem.startListening();
        setVoiceEnabled(true);
      }
    } else {
      setVoiceEnabled(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary-500" />
            Accessibility Settings
          </h1>
          <p className="text-text-muted mt-1">
            Customize your experience for better accessibility
          </p>
        </div>

        <div className="space-y-6">
          {/* Visual Settings */}
          <Section
            icon={<Eye className="w-6 h-6" />}
            title="Visual"
            description="Adjust display and readability"
          >
            <ToggleSetting
              label="High Contrast"
              description="Increase contrast for better visibility"
              checked={settings.highContrast}
              onChange={(checked) => updateSettings({ highContrast: checked })}
            />
            <ToggleSetting
              label="Reduce Motion"
              description="Minimize animations and transitions"
              checked={settings.reducedMotion}
              onChange={(checked) => updateSettings({ reducedMotion: checked })}
            />
            <ToggleSetting
              label="Large Text"
              description="Increase default text size"
              checked={settings.largeText}
              onChange={(checked) => updateSettings({ largeText: checked })}
            />
            <SliderSetting
              label="Text Scaling"
              description={`${Math.round(settings.textScaling * 100)}%`}
              value={settings.textScaling}
              min={0.5}
              max={2.0}
              step={0.1}
              onChange={(value) => updateSettings({ textScaling: value })}
            />
            <SelectSetting
              label="Color Blind Mode"
              description="Adjust colors for color blindness"
              value={settings.colorBlindMode}
              options={[
                { value: 'none', label: 'None' },
                { value: 'protanopia', label: 'Protanopia (Red-Blind)' },
                { value: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
                { value: 'tritanopia', label: 'Tritanopia (Blue-Blind)' },
              ]}
              onChange={(value) => updateSettings({ colorBlindMode: value as any })}
            />
          </Section>

          {/* Audio Settings */}
          <Section
            icon={<Ear className="w-6 h-6" />}
            title="Audio"
            description="Sound and voice settings"
          >
            <ToggleSetting
              label="Screen Reader"
              description="Enable screen reader support"
              checked={settings.screenReader}
              onChange={(checked) => updateSettings({ screenReader: checked })}
            />
            <ToggleSetting
              label="Sound Effects"
              description="Play sounds for actions"
              checked={settings.soundEffects}
              onChange={(checked) => updateSettings({ soundEffects: checked })}
            />
            <ToggleSetting
              label="Voice Feedback"
              description="Speak notifications and messages"
              checked={settings.voiceFeedback}
              onChange={(checked) => updateSettings({ voiceFeedback: checked })}
            />
          </Section>

          {/* Interaction Settings */}
          <Section
            icon={<Hand className="w-6 h-6" />}
            title="Interaction"
            description="Keyboard and input settings"
          >
            <ToggleSetting
              label="Keyboard Navigation"
              description="Enable keyboard shortcuts"
              checked={settings.keyboardNavigation}
              onChange={(checked) => updateSettings({ keyboardNavigation: checked })}
            />
            <ToggleSetting
              label="Sticky Keys"
              description="Press modifier keys one at a time"
              checked={settings.stickyKeys}
              onChange={(checked) => updateSettings({ stickyKeys: checked })}
            />
            <ToggleSetting
              label="Slow Keys"
              description="Require longer press for keys"
              checked={settings.slowKeys}
              onChange={(checked) => updateSettings({ slowKeys: checked })}
            />
            {settings.slowKeys && (
              <SliderSetting
                label="Slow Keys Delay"
                description={`${settings.slowKeysDelay}ms`}
                value={settings.slowKeysDelay}
                min={100}
                max={1000}
                step={50}
                onChange={(value) => updateSettings({ slowKeysDelay: value })}
              />
            )}
            <SelectSetting
              label="Focus Indicator"
              description="Highlight style for focused elements"
              value={settings.focusIndicator}
              options={[
                { value: 'default', label: 'Default' },
                { value: 'enhanced', label: 'Enhanced' },
                { value: 'high-visibility', label: 'High Visibility' },
              ]}
              onChange={(value) => updateSettings({ focusIndicator: value as any })}
            />
          </Section>

          {/* Cognitive Settings */}
          <Section
            icon={<Brain className="w-6 h-6" />}
            title="Cognitive"
            description="Reading and comprehension aids"
          >
            <ToggleSetting
              label="Simplified UI"
              description="Show simpler interface with less clutter"
              checked={settings.simplifiedUI}
              onChange={(checked) => updateSettings({ simplifiedUI: checked })}
            />
            <ToggleSetting
              label="Reading Guide"
              description="Highlight line under cursor"
              checked={settings.readingGuide}
              onChange={(checked) => updateSettings({ readingGuide: checked })}
            />
            <ToggleSetting
              label="Dyslexia Font"
              description="Use font designed for dyslexia"
              checked={settings.dyslexiaFont}
              onChange={(checked) => updateSettings({ dyslexiaFont: checked })}
            />
            <SliderSetting
              label="Line Spacing"
              description={`${settings.lineSpacing.toFixed(1)}`}
              value={settings.lineSpacing}
              min={1.0}
              max={3.0}
              step={0.1}
              onChange={(value) => updateSettings({ lineSpacing: value })}
            />
          </Section>

          {/* Voice Commands */}
          <Section
            icon={<Mic className="w-6 h-6" />}
            title="Voice Commands"
            description="Control the app with your voice"
          >
            <div className="flex items-center justify-between p-4 bg-surface-base rounded-lg">
              <div>
                <p className="font-medium text-text-primary">Enable Voice Commands</p>
                <p className="text-sm text-text-muted mt-1">
                  Say "Ibimina" to activate, then give commands
                </p>
              </div>
              <button
                onClick={toggleVoice}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  voiceEnabled
                    ? 'bg-error-500 hover:bg-error-600 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                {voiceEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            {voiceEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-primary-500/10 rounded-lg border border-primary-500/20"
              >
                <div className="flex items-center gap-2 text-primary-500 mb-2">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="font-medium">Listening...</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Try: "Go to dashboard", "Show payments", "Add member"
                </p>
              </motion.div>
            )}
          </Section>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="bg-surface-elevated rounded-xl border border-border-default p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <ShortcutItem shortcut="Alt + 1" description="Skip to content" />
            <ShortcutItem shortcut="Alt + M" description="Focus main area" />
            <ShortcutItem shortcut="Alt + H" description="Toggle high contrast" />
            <ShortcutItem shortcut="Ctrl/⌘ + =" description="Increase text size" />
            <ShortcutItem shortcut="Ctrl/⌘ + -" description="Decrease text size" />
            <ShortcutItem shortcut="Ctrl/⌘ + 0" description="Reset text size" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-elevated rounded-xl border border-border-default p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-base rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-sm text-text-muted mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-8 rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-surface-subtle'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 28 : 4 }}
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
        />
      </button>
    </div>
  );
}

function SliderSetting({ label, description, value, min, max, step, onChange }: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="p-4 bg-surface-base rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
    </div>
  );
}

function SelectSetting({ label, description, value, options, onChange }: {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="p-4 bg-surface-base rounded-lg">
      <p className="font-medium text-text-primary mb-1">{label}</p>
      <p className="text-sm text-text-muted mb-3">{description}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ShortcutItem({ shortcut, description }: {
  shortcut: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{description}</span>
      <kbd className="px-2 py-1 bg-surface-subtle border border-border-default rounded text-xs font-mono">
        {shortcut}
      </kbd>
    </div>
  );
}
