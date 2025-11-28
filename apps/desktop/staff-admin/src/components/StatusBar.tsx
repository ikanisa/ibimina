import React from 'react';
import { Command, Wifi, Database, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface StatusBarProps {
  onCommandPaletteClick: () => void;
}

export function StatusBar({ onCommandPaletteClick }: StatusBarProps) {
  return (
    <div className="h-6 flex items-center justify-between px-4 bg-surface-base border-t border-border-default text-xs text-text-muted">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onCommandPaletteClick}
          className="flex items-center gap-1 hover:text-primary-600 transition-fast"
        >
          <Command className="w-3 h-3" />
          <span>Command Palette</span>
          <kbd className="ml-1 px-1 bg-surface-overlay rounded text-[10px] font-mono">⌘K</kbd>
        </button>
        
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3 text-success" />
          <span>Connected</span>
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-success" />
          <span>Sync complete • 2m ago</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3 text-success" />
          <span>Online</span>
        </div>
      </div>
    </div>
  );
}
