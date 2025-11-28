interface WindowControlProps {
  color: 'red' | 'yellow' | 'green';
  action: 'close' | 'minimize' | 'maximize';
}

function WindowControl({ color, action }: WindowControlProps) {
  const colors = {
    red: '#ff5f57',
    yellow: '#febc2e',
    green: '#28c840',
  };

  const handleClick = () => {
    // Tauri window controls would go here
    console.log(`Window action: ${action}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-3 h-3 rounded-full hover:opacity-80 transition-opacity"
      style={{ backgroundColor: colors[color] }}
      aria-label={action}
    />
  );
}

function SyncIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
      <span>Synced</span>
    </div>
  );
}

function UserMenu() {
  return (
    <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-overlay transition-colors">
      <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-xs text-white font-medium">
        JD
      </div>
    </button>
  );
}

export function TitleBar() {
  return (
    <div 
      className="h-9 flex items-center justify-between px-4 bg-surface-base border-b border-border-default select-none"
      data-tauri-drag-region
    >
      {/* Window Controls (macOS style) */}
      <div className="flex items-center gap-2">
        <WindowControl color="red" action="close" />
        <WindowControl color="yellow" action="minimize" />
        <WindowControl color="green" action="maximize" />
      </div>

      {/* App Title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <img src="/icon.svg" alt="" className="w-4 h-4" />
        <span className="text-sm font-medium text-text-secondary">
          SACCO+ Staff Admin
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <SyncIndicator />
        <UserMenu />
      </div>
    </div>
  );
}
