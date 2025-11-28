import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PanelGroup, 
  Panel, 
  PanelResizeHandle 
} from 'react-resizable-panels';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { ActivityBar } from './ActivityBar';
import { StatusBar } from './StatusBar';
import { AIAssistantPanel } from './AIAssistantPanel';
import { NotificationCenter } from './NotificationCenter';
import { TitleBar } from './TitleBar';
import { useHotkeys } from '@/hooks/use-hotkeys';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'ai' | 'notifications' | 'activity'>('ai');

  // Global hotkeys for desktop-native experience
  useHotkeys([
    { keys: ['Meta', 'k'], action: () => setCommandPaletteOpen(true) },
    { keys: ['Meta', 'b'], action: () => setSidebarCollapsed(prev => !prev) },
    { keys: ['Meta', 'Shift', 'a'], action: () => setAiPanelOpen(prev => !prev) },
    { keys: ['Meta', 'Shift', 'n'], action: () => setNotificationsOpen(prev => !prev) },
    { keys: ['Escape'], action: () => {
      setCommandPaletteOpen(false);
      setAiPanelOpen(false);
    }},
  ]);

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-base overflow-hidden">
      {/* Title Bar (Custom for frameless window) */}
      <TitleBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (Icon-only navigation) */}
        <ActivityBar 
          onAIClick={() => setAiPanelOpen(true)}
          onNotificationsClick={() => setNotificationsOpen(true)}
        />

        {/* Resizable Panel Group */}
        <PanelGroup direction="horizontal" className="flex-1">
          {/* Sidebar Panel */}
          <Panel 
            defaultSize={20} 
            minSize={15} 
            maxSize={35}
            collapsible
            collapsedSize={0}
          >
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <Sidebar />
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border-default hover:bg-primary-500 transition-colors cursor-col-resize" />

          {/* Main Content Panel */}
          <Panel defaultSize={aiPanelOpen ? 55 : 80} minSize={40}>
            <main className="h-full overflow-auto bg-surface-elevated">
              {children}
            </main>
          </Panel>

          {/* AI Assistant / Right Panel */}
          <AnimatePresence>
            {aiPanelOpen && (
              <>
                <PanelResizeHandle className="w-1 bg-border-default hover:bg-primary-500 transition-colors cursor-col-resize" />
                <Panel defaultSize={25} minSize={20} maxSize={40}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full"
                  >
                    <AIAssistantPanel 
                      onClose={() => setAiPanelOpen(false)}
                      tab={rightPanelTab}
                      onTabChange={setRightPanelTab}
                    />
                  </motion.div>
                </Panel>
              </>
            )}
          </AnimatePresence>
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar 
        onCommandPaletteClick={() => setCommandPaletteOpen(true)}
      />

      {/* Command Palette (Global) */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Notification Center (Slide-over) */}
      <NotificationCenter
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
