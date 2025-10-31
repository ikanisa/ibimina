/**
 * Join Request Dialog Component
 *
 * Modal dialog for requesting to join a group (ikimina).
 * Submits request with PENDING status until staff approves.
 *
 * Features:
 * - Group name display
 * - Optional note field
 * - Send button with loading state
 * - Status feedback (PENDING after submission)
 * - Accessible modal with keyboard navigation
 * - Focus trap
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, AlertCircle, CheckCircle2 } from "lucide-react";

interface JoinRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  groupId: string;
  onSubmit: (groupId: string, note: string) => Promise<void>;
}

export function JoinRequestDialog({
  isOpen,
  onClose,
  groupName,
  groupId,
  onSubmit,
}: JoinRequestDialogProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setNote("");
      setIsSuccess(false);
      setError(null);

      // Focus first interactive element
      const firstButton = dialogRef.current?.querySelector("button, input, textarea");
      if (firstButton instanceof HTMLElement) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(groupId, note);
      setIsSuccess(true);

      // Close dialog after showing success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit join request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="dialog-title" className="text-xl font-bold text-gray-900">
            Request to Join
          </h2>
          <button
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">Group</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{groupName}</p>
          </div>

          {/* Note Field */}
          <div className="space-y-2">
            <label htmlFor="join-note" className="block text-sm font-semibold text-gray-700">
              Add a note (optional)
            </label>
            <textarea
              id="join-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Why do you want to join this group?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSubmitting || isSuccess}
            />
            <p className="text-xs text-gray-600 text-right">{note.length}/200 characters</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-green-900">Request Sent!</p>
                <p className="text-xs text-green-700 mt-1">
                  Your request is pending approval by SACCO staff.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="flex-1 min-h-[48px] px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>Sent</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" aria-hidden="true" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>

          {/* Info */}
          {!isSuccess && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-700">
                <strong>Note:</strong> Your request will be reviewed by SACCO staff. You&apos;ll be
                notified once approved.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
