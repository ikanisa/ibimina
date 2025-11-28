/**
 * Accessibility Menu Component
 * Floating accessibility settings panel
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Volume2,
  Keyboard,
  Type,
  Contrast,
  ZoomIn,
  Palette,
  Moon,
  Sun,
  X,
} from 'lucide-react';

interface AccessibilityMenuProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void;
}

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  textScaling: number;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  screenReader: boolean;
  voiceFeedback: boolean;
  keyboardNavigation: boolean;
  darkMode: boolean;
}

export function AccessibilityMenu({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: AccessibilityMenuProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'interaction'>('visual');

  const tabs = [
    { id: 'visual', label: 'Visual', icon: Eye },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'interaction', label: 'Interaction', icon: Keyboard },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Accessibility
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close accessibility menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                        transition-all
                        ${
                          activeTab === tab.id
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'visual' && (
                  <VisualSettings settings={settings} onUpdate={onUpdateSettings} />
                )}
                {activeTab === 'audio' && (
                  <AudioSettings settings={settings} onUpdate={onUpdateSettings} />
                )}
                {activeTab === 'interaction' && (
                  <InteractionSettings settings={settings} onUpdate={onUpdateSettings} />
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  // Reset to defaults
                  onUpdateSettings({
                    highContrast: false,
                    reducedMotion: false,
                    largeText: false,
                    textScaling: 1.0,
                    colorBlindMode: 'none',
                    screenReader: false,
                    voiceFeedback: false,
                    keyboardNavigation: true,
                  });
                }}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                Reset to Defaults
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function VisualSettings({
  settings,
  onUpdate,
}: {
  settings: AccessibilitySettings;
  onUpdate: (s: Partial<AccessibilitySettings>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Dark Mode */}
      <ToggleSetting
        icon={settings.darkMode ? Moon : Sun}
        label="Dark Mode"
        description="Reduce eye strain in low light"
        value={settings.darkMode}
        onChange={(v) => onUpdate({ darkMode: v })}
      />

      {/* High Contrast */}
      <ToggleSetting
        icon={Contrast}
        label="High Contrast"
        description="Increase color contrast for better visibility"
        value={settings.highContrast}
        onChange={(v) => onUpdate({ highContrast: v })}
      />

      {/* Large Text */}
      <ToggleSetting
        icon={Type}
        label="Large Text"
        description="Increase base font size"
        value={settings.largeText}
        onChange={(v) => onUpdate({ largeText: v })}
      />

      {/* Text Scaling */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ZoomIn className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">Text Size</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(settings.textScaling * 100)}%
            </p>
          </div>
        </div>
        <input
          type="range"
          min="0.8"
          max="2.0"
          step="0.1"
          value={settings.textScaling}
          onChange={(e) => onUpdate({ textScaling: parseFloat(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Color Blind Mode */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">Color Blind Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Adjust colors for color blindness
            </p>
          </div>
        </div>
        <select
          value={settings.colorBlindMode}
          onChange={(e) => onUpdate({ colorBlindMode: e.target.value as any })}
          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          <option value="protanopia">Protanopia (Red-Blind)</option>
          <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
          <option value="tritanopia">Tritanopia (Blue-Blind)</option>
        </select>
      </div>

      {/* Reduced Motion */}
      <ToggleSetting
        icon={Eye}
        label="Reduce Motion"
        description="Minimize animations and transitions"
        value={settings.reducedMotion}
        onChange={(v) => onUpdate({ reducedMotion: v })}
      />
    </motion.div>
  );
}

function AudioSettings({
  settings,
  onUpdate,
}: {
  settings: AccessibilitySettings;
  onUpdate: (s: Partial<AccessibilitySettings>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <ToggleSetting
        icon={Volume2}
        label="Screen Reader"
        description="Enable screen reader support"
        value={settings.screenReader}
        onChange={(v) => onUpdate({ screenReader: v })}
      />

      <ToggleSetting
        icon={Volume2}
        label="Voice Feedback"
        description="Hear text-to-speech confirmations"
        value={settings.voiceFeedback}
        onChange={(v) => onUpdate({ voiceFeedback: v })}
      />
    </motion.div>
  );
}

function InteractionSettings({
  settings,
  onUpdate,
}: {
  settings: AccessibilitySettings;
  onUpdate: (s: Partial<AccessibilitySettings>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <ToggleSetting
        icon={Keyboard}
        label="Keyboard Navigation"
        description="Enable enhanced keyboard shortcuts"
        value={settings.keyboardNavigation}
        onChange={(v) => onUpdate({ keyboardNavigation: v })}
      />

      {/* Keyboard Shortcuts Reference */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Keyboard Shortcuts
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700 dark:text-blue-300">Alt + 1</span>
            <span className="text-blue-600 dark:text-blue-400">Skip to content</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700 dark:text-blue-300">Alt + H</span>
            <span className="text-blue-600 dark:text-blue-400">Toggle high contrast</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700 dark:text-blue-300">Ctrl + =</span>
            <span className="text-blue-600 dark:text-blue-400">Increase text size</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700 dark:text-blue-300">Ctrl + -</span>
            <span className="text-blue-600 dark:text-blue-400">Decrease text size</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ToggleSetting({
  icon: Icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: any;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <Icon className="w-5 h-5 text-gray-400" />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`
          relative w-12 h-6 rounded-full transition-colors
          ${value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
        `}
        aria-label={`Toggle ${label}`}
        aria-pressed={value}
      >
        <motion.div
          animate={{ x: value ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        />
      </button>
    </div>
  );
}
