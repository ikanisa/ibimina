/**
 * Voice Settings Panel
 */

import { Volume2, Mic, Settings } from 'lucide-react';

interface VoiceSettingsProps {
  settings: {
    enabled: boolean;
    wakeWord: string;
    voiceFeedback: boolean;
  };
  onUpdate: (settings: any) => void;
}

export function VoiceSettings({ settings, onUpdate }: VoiceSettingsProps) {
  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-900 rounded-xl border">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Voice Settings
      </h3>

      <div className="space-y-3">
        <ToggleItem
          icon={Mic}
          label="Voice Commands"
          value={settings.enabled}
          onChange={(v) => onUpdate({ ...settings, enabled: v })}
        />

        <ToggleItem
          icon={Volume2}
          label="Voice Feedback"
          value={settings.voiceFeedback}
          onChange={(v) => onUpdate({ ...settings, voiceFeedback: v })}
        />

        <div>
          <label className="text-sm font-medium">Wake Word</label>
          <input
            type="text"
            value={settings.wakeWord}
            onChange={(e) => onUpdate({ ...settings, wakeWord: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

function ToggleItem({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: any;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-400" />
        <span>{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors ${
          value ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full transition-transform ${
            value ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
