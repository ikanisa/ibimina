/**
 * Command Palette - Quick actions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: Array<{
    id: string;
    label: string;
    action: () => void;
  }>;
}

export function CommandPalette({ isOpen, onClose, commands = [] }: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50"
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  placeholder="Search commands..."
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {commands
                .filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
                .map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    {cmd.label}
                  </button>
                ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
