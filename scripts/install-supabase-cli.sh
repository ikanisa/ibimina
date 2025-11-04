#!/usr/bin/env bash
# Install Supabase CLI for local development
# This script downloads and installs the latest Supabase CLI binary

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Installing Supabase CLI..."

# Check if already installed
if command -v supabase &> /dev/null; then
    CURRENT_VERSION=$(supabase --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    echo "Supabase CLI is already installed (v$CURRENT_VERSION)"
    read -p "Do you want to reinstall? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Detect OS and architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
    x86_64)
        ARCH="amd64"
        ;;
    aarch64|arm64)
        ARCH="arm64"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

case "$OS" in
    linux)
        BINARY="supabase_${OS}_${ARCH}.tar.gz"
        ;;
    darwin)
        BINARY="supabase_${OS}_${ARCH}.tar.gz"
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

# Download and install
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading Supabase CLI..."
curl -sL "https://github.com/supabase/cli/releases/latest/download/$BINARY" -o "$TMP_DIR/supabase.tar.gz"

echo "Extracting..."
tar -xzf "$TMP_DIR/supabase.tar.gz" -C "$TMP_DIR"

echo "Installing to /usr/local/bin..."
sudo mv "$TMP_DIR/supabase" /usr/local/bin/
sudo chmod +x /usr/local/bin/supabase

# Verify installation
VERSION=$(supabase --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
echo "✅ Supabase CLI v$VERSION installed successfully"

# Check Docker configuration for local development
if command -v docker &> /dev/null; then
    echo ""
    echo "Checking Docker configuration..."
    
    if docker info &> /dev/null; then
        echo "✅ Docker is running"
        
        # Check if we're in a CI environment
        if [[ -n "${CI:-}" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]]; then
            echo "⚠️  CI environment detected"
            echo "   Note: Docker embedded DNS may not work properly in CI environments"
            echo "   You may need to use remote Supabase operations instead of local stack"
        fi
    else
        echo "⚠️  Docker is not running"
        echo "   Start Docker to use 'supabase start' for local development"
    fi
fi

echo ""
echo "Next steps:"
echo "  1. Initialize Supabase in your project: cd $PROJECT_ROOT && supabase init"
echo "  2. Start local development: supabase start"
echo "  3. Link to remote project: supabase link --project-ref <project-ref>"
echo ""
echo "For more information, visit: https://supabase.com/docs/guides/cli"
