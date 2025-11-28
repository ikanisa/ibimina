import React from 'react';
import { Search, Plus, FolderOpen, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const sections = [
    {
      title: 'Dashboard',
      items: [
        { label: 'Overview', count: null },
        { label: 'Analytics', count: null },
      ],
    },
    {
      title: 'Members',
      items: [
        { label: 'All Members', count: 1234 },
        { label: 'Active', count: 1150 },
        { label: 'Pending', count: 84 },
      ],
    },
    {
      title: 'Ikimina Groups',
      items: [
        { label: 'All Groups', count: 47 },
        { label: 'Active', count: 43 },
        { label: 'Needs Attention', count: 4 },
      ],
    },
    {
      title: 'Payments',
      items: [
        { label: 'Recent', count: null },
        { label: 'Pending', count: 23 },
        { label: 'Failed', count: 5 },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-surface-base border-r border-border-default">
      {/* Header */}
      <div className="p-4 border-b border-border-default">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-surface-overlay border border-border-default rounded-lg text-body-sm placeholder:text-text-muted focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-fast"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-3 space-y-6">
        {sections.map((section, i) => (
          <div key={i}>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {section.title}
              </h3>
              <button className="p-0.5 hover:bg-surface-overlay rounded transition-fast">
                <Plus className="w-3 h-3 text-text-muted" />
              </button>
            </div>
            <nav className="space-y-1">
              {section.items.map((item, j) => (
                <button
                  key={j}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-body-sm text-text-secondary hover:bg-surface-overlay hover:text-primary-600 transition-fast group"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-fast" />
                    <span>{item.label}</span>
                  </span>
                  {item.count !== null && (
                    <span className="text-xs text-text-muted bg-surface-overlay px-2 py-0.5 rounded-full font-medium">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );
}
