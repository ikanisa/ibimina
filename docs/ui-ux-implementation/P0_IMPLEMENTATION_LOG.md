# P0 Critical Issues - Implementation Log

**Started:** 2025-11-05 17:45 UTC **Status:** IN PROGRESS

## Overview

Implementing 12 blocker-level issues that prevent production deployment.

---

## Issue #1: A11Y-1 Text Contrast Fixes

**Problem:** `text-neutral-600` on light backgrounds = 3.8:1 (needs 4.5:1 for
WCAG AA) **Solution:** Change to `text-neutral-700` (7.0:1 ratio)  
**Status:** STARTING

### Files to Check:

- apps/website/\*_/_.tsx
- apps/client/\*_/_.tsx
- apps/staff-admin-pwa/\*_/_.tsx

### Implementation Steps:

1. Search for all instances of `text-neutral-600`
2. Evaluate background color context
3. Replace with `text-neutral-700` where on light backgrounds
4. Test visual appearance
5. Verify with color contrast checker
