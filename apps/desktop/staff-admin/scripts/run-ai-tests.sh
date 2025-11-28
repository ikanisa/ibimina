#!/bin/bash

# AI Features Test Runner
# Runs all tests for AI features with detailed reporting

set -e

echo "🧪 AI Features Test Suite"
echo "========================="
echo ""

FAILED=0

# Unit Tests
echo "📦 Running Unit Tests..."
if pnpm test:unit --passWithNoTests 2>&1 | tee test-unit.log; then
  echo "✅ Unit tests passed"
else
  echo "❌ Unit tests failed"
  FAILED=$((FAILED + 1))
fi
echo ""

# Integration Tests
echo "🔗 Running Integration Tests..."
if pnpm test:integration --passWithNoTests 2>&1 | tee test-integration.log; then
  echo "✅ Integration tests passed"
else
  echo "❌ Integration tests failed"
  FAILED=$((FAILED + 1))
fi
echo ""

# E2E Tests
echo "🌐 Running E2E Tests..."
if pnpm test:e2e --passWithNoTests 2>&1 | tee test-e2e.log; then
  echo "✅ E2E tests passed"
else
  echo "❌ E2E tests failed"
  FAILED=$((FAILED + 1))
fi
echo ""

# Accessibility Tests
echo "♿ Running Accessibility Tests..."
if pnpm test:a11y --passWithNoTests 2>&1 | tee test-a11y.log; then
  echo "✅ Accessibility tests passed"
else
  echo "❌ Accessibility tests failed"
  FAILED=$((FAILED + 1))
fi
echo ""

# Coverage Report
echo "📊 Generating Coverage Report..."
if pnpm test:coverage --passWithNoTests; then
  echo "✅ Coverage report generated"
else
  echo "⚠️  Coverage report generation failed (non-critical)"
fi
echo ""

# Summary
echo "========================="
echo "Test Summary"
echo "========================="
if [ $FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ $FAILED test suite(s) failed"
  exit 1
fi
