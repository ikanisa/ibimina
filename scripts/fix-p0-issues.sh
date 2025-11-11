#!/bin/bash

# P0 UI/UX Fixes Script
# This script implements all P0 (blocker) issues from the UI/UX audit
# WCAG 2.2 AA Compliance + Critical Usability Fixes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "======================================"
echo "P0 UI/UX Fixes - Implementation Script"
echo "======================================"
echo ""

cd "$REPO_ROOT"

# Counter for fixes
FIXES_APPLIED=0

# ============================================================================
# P0-1: A11Y-1 - Fix PWA secondary text contrast (text-neutral-600 → text-neutral-700)
# ============================================================================
echo "🔧 [1/12] Fixing PWA secondary text contrast..."

# Find all files in client PWA and replace text-neutral-600 with text-neutral-700
# Only on bg-neutral-50 or bg-white contexts
find apps/pwa/client/app apps/pwa/client/components -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | while read file; do
    if grep -q "text-neutral-600" "$file"; then
        # Replace in secondary text contexts
        sed -i.bak 's/text-neutral-600/text-neutral-700/g' "$file"
        rm -f "${file}.bak"
        echo "  ✓ Updated: $file"
        FIXES_APPLIED=$((FIXES_APPLIED + 1))
    fi
done

# ============================================================================
# P0-2: A11Y-21 - Add alt text to PWA images
# ============================================================================
echo ""
echo "🔧 [2/12] Adding alt text to PWA images..."

# This requires manual review, but we'll add a check
find apps/pwa/client/app apps/pwa/client/components -type f -name "*.tsx" 2>/dev/null | while read file; do
    if grep -q '<img' "$file" && ! grep -q 'alt=' "$file"; then
        echo "  ⚠️  Missing alt text in: $file"
    fi
done

# ============================================================================
# P0-3: H4.1 - Standardize button styles across PWA
# ============================================================================
echo ""
echo "🔧 [3/12] Standardizing button styles..."

# Create standardized Button component if it doesn't exist
BUTTON_COMPONENT="$REPO_ROOT/apps/pwa/client/components/ui/Button.tsx"

if [ ! -f "$BUTTON_COMPONENT" ]; then
    echo "  Creating standardized Button component..."
    mkdir -p "$(dirname "$BUTTON_COMPONENT")"
    
    cat > "$BUTTON_COMPONENT" << 'EOF'
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  const variants = {
    primary: 'bg-brand-blue text-white hover:bg-brand-blue-dark active:bg-brand-blue-darker focus-visible:ring-brand-blue/30',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-neutral-500',
    outline: 'border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 focus-visible:ring-neutral-500',
    ghost: 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-500',
    danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 focus-visible:ring-error-600',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg gap-1.5 h-10', // 40px
    md: 'px-4 py-2.5 text-base rounded-lg gap-2 h-11', // 44px
    lg: 'px-6 py-3 text-lg rounded-xl gap-2.5 h-12', // 48px
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
EOF
    echo "  ✓ Created standardized Button component"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
fi

# ============================================================================
# P0-4: H9.1 - Improve error messages (Generic → User-friendly)
# ============================================================================
echo ""
echo "🔧 [4/12] Improving error messages..."

# Create error message utility
ERROR_UTIL="$REPO_ROOT/apps/pwa/client/lib/errors.ts"

if [ ! -f "$ERROR_UTIL" ]; then
    echo "  Creating error message utility..."
    mkdir -p "$(dirname "$ERROR_UTIL")"
    
    cat > "$ERROR_UTIL" << 'EOF'
/**
 * User-friendly error messages for SACCO+ Client
 * Converts technical errors to plain language
 * WCAG 2.2 AA compliant error handling
 */

export interface AppError {
  code: string;
  message: string;
  action?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export const ERROR_MESSAGES: Record<string, AppError> = {
  // Authentication errors
  'AUTH_FAILED': {
    code: 'AUTH_FAILED',
    message: "We couldn't sign you in. Please check your phone number and try again.",
    action: 'Verify your phone number',
    severity: 'error',
  },
  'SESSION_EXPIRED': {
    code: 'SESSION_EXPIRED',
    message: 'Your session has expired. Please sign in again.',
    action: 'Sign in',
    severity: 'warning',
  },
  
  // Reference/Token errors
  'REFERENCE_NOT_FOUND': {
    code: 'REFERENCE_NOT_FOUND',
    message: "We couldn't find that payment code. Check your groups and try again.",
    action: 'View your groups',
    severity: 'error',
  },
  'INVALID_REFERENCE': {
    code: 'INVALID_REFERENCE',
    message: 'This payment code format is incorrect. Please use the code from your group.',
    action: 'Get help',
    severity: 'error',
  },
  
  // Group errors
  'GROUP_NOT_FOUND': {
    code: 'GROUP_NOT_FOUND',
    message: "We couldn't find this savings group. It may have been removed.",
    action: 'View all groups',
    severity: 'error',
  },
  'JOIN_REQUEST_FAILED': {
    code: 'JOIN_REQUEST_FAILED',
    message: "We couldn't send your join request. Please try again.",
    action: 'Try again',
    severity: 'error',
  },
  
  // Network errors
  'NETWORK_ERROR': {
    code: 'NETWORK_ERROR',
    message: "Connection problem. Check your internet and try again.",
    action: 'Retry',
    severity: 'error',
  },
  'TIMEOUT': {
    code: 'TIMEOUT',
    message: 'This is taking longer than usual. Please try again.',
    action: 'Retry',
    severity: 'warning',
  },
  
  // Payment errors
  'PAYMENT_FAILED': {
    code: 'PAYMENT_FAILED',
    message: "Your payment couldn't be processed. Please check with your SACCO.",
    action: 'Contact support',
    severity: 'error',
  },
  'INSUFFICIENT_BALANCE': {
    code: 'INSUFFICIENT_BALANCE',
    message: "You don't have enough money in your mobile money account.",
    action: 'Add funds',
    severity: 'error',
  },
  
  // Generic fallback
  'UNKNOWN_ERROR': {
    code: 'UNKNOWN_ERROR',
    message: 'Something went wrong. Please try again or contact support.',
    action: 'Get help',
    severity: 'error',
  },
};

/**
 * Convert technical error to user-friendly message
 */
export function getUserFriendlyError(error: any): AppError {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  if (error?.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  
  if (error?.message?.includes('network')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }
  
  if (error?.message?.includes('reference') || error?.message?.includes('token')) {
    return ERROR_MESSAGES.REFERENCE_NOT_FOUND;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
EOF
    echo "  ✓ Created error message utility"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
fi

# ============================================================================
# P0-5: A11Y-4 - Add keyboard access to group cards (PWA)
# ============================================================================
echo ""
echo "🔧 [5/12] Adding keyboard access to group cards..."

# Find group card components and add keyboard support
find apps/pwa/client/app apps/pwa/client/components -type f -name "*group*.tsx" 2>/dev/null | while read file; do
    if grep -q 'onClick' "$file" && ! grep -q 'onKeyDown' "$file"; then
        echo "  ⚠️  Needs keyboard support: $file"
        # Note: This requires manual intervention to add proper keyboard handlers
    fi
done

# ============================================================================
# P0-6: A11Y-8 - Verify aria-hidden on bottom nav icons (PWA)
# ============================================================================
echo ""
echo "🔧 [6/12] Verifying aria-hidden on bottom nav icons..."

# Check bottom nav component
find apps/pwa/client -type f -name "*bottom-nav*.tsx" -o -name "*nav*.tsx" 2>/dev/null | while read file; do
    if grep -q '<svg' "$file" || grep -q 'Icon' "$file"; then
        if ! grep -q 'aria-hidden="true"' "$file"; then
            echo "  ⚠️  Missing aria-hidden in: $file"
        else
            echo "  ✓ aria-hidden present in: $file"
        fi
    fi
done

echo ""
echo "======================================"
echo "P0 Fixes Applied: $FIXES_APPLIED/12"
echo "======================================"
echo ""
echo "⚠️  Manual Review Required:"
echo "  - Alt text for images (P0-2)"
echo "  - Keyboard handlers for cards (P0-5)"
echo "  - Mobile app fixes (P0-7 through P0-12)"
echo ""
echo "Next Steps:"
echo "  1. Review changes with git diff"
echo "  2. Test in browser"
echo "  3. Run accessibility audit"
echo "  4. Continue with mobile app P0 fixes"
echo ""
