#!/bin/bash

# mkcert setup script for local HTTPS
# This generates TLS certificates for local development

set -e

echo "🔐 Setting up mkcert for local HTTPS..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed."
    echo ""
    echo "Install mkcert:"
    echo "  macOS:   brew install mkcert"
    echo "  Linux:   https://github.com/FiloSottile/mkcert#linux"
    echo "  Windows: https://github.com/FiloSottile/mkcert#windows"
    echo ""
    exit 1
fi

echo "✓ mkcert found"

# Install local CA
echo "Installing local CA..."
mkcert -install

# Create certs directory
CERT_DIR="$(dirname "$0")/../deploy/nginx/certs"
mkdir -p "$CERT_DIR"

# Generate certificates
echo "Generating certificates for admin.local and localhost..."
cd "$CERT_DIR"
mkcert -key-file key.pem -cert-file cert.pem admin.local localhost 127.0.0.1 ::1

echo ""
echo "✓ Certificates generated in deploy/nginx/certs/"
echo ""
echo "Add to /etc/hosts:"
echo "  127.0.0.1  admin.local"
echo ""
echo "Then access your app at:"
echo "  https://admin.local:8443"
echo ""
