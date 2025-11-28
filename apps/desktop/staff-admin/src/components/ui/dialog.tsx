import React, { useEffect, useCallback } from 'react';

interface DialogProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: string;
}

export function Dialog({ open, isOpen, onClose, title, children, className }: DialogProps) {
  const isDialogOpen = open ?? isOpen ?? false;
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isDialogOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isDialogOpen, handleKeyDown]);

  if (!isDialogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className || ''}`} role="dialog" aria-modal="true">
        {title && <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">{title}</h2></div>}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function DialogTrigger({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <div onClick={onClick}>{children}</div>;
}
export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}
export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex justify-end gap-2">{children}</div>;
}
