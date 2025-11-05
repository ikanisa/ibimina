#!/bin/bash
# Generate Release Keystores for Ibimina Mobile Apps
# CRITICAL: Store these securely - losing them means losing update capability

set -e

echo "🔐 Ibimina Mobile Apps - Keystore Generation"
echo "==========================================="
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo ""
echo "1. Keystores are CRITICAL - back them up securely"
echo "2. If you lose a keystore, you CANNOT update that app"
echo "3. Store passwords in 1Password, LastPass, or secure vault"
echo "4. NEVER commit keystores to git"
echo "5. Use different keystores for each app"
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Create keystores directory
KEYSTORE_DIR="$HOME/.ibimina/keystores"
mkdir -p "$KEYSTORE_DIR"
chmod 700 "$KEYSTORE_DIR"

echo ""
echo "📁 Keystores will be stored in: $KEYSTORE_DIR"
echo ""

# Function to generate a keystore
generate_keystore() {
    local APP_NAME=$1
    local PACKAGE_NAME=$2
    local KEYSTORE_FILE="$KEYSTORE_DIR/ibimina-${APP_NAME}-release.keystore"
    local ALIAS="ibimina-${APP_NAME}"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Generating keystore for: $APP_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if [ -f "$KEYSTORE_FILE" ]; then
        echo "⚠️  Keystore already exists: $KEYSTORE_FILE"
        read -p "Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "⏭️  Skipping $APP_NAME"
            return
        fi
        rm "$KEYSTORE_FILE"
    fi
    
    echo "Enter keystore password (min 6 characters):"
    read -s KEYSTORE_PASSWORD
    echo ""
    echo "Confirm keystore password:"
    read -s KEYSTORE_PASSWORD_CONFIRM
    echo ""
    
    if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
        echo "❌ Passwords don't match!"
        return 1
    fi
    
    if [ ${#KEYSTORE_PASSWORD} -lt 6 ]; then
        echo "❌ Password too short (min 6 characters)!"
        return 1
    fi
    
    echo "Enter key password (min 6 characters, can be same as keystore):"
    read -s KEY_PASSWORD
    echo ""
    
    if [ ${#KEY_PASSWORD} -lt 6 ]; then
        echo "❌ Password too short (min 6 characters)!"
        return 1
    fi
    
    echo ""
    echo "Generating keystore..."
    
    keytool -genkey -v \
        -keystore "$KEYSTORE_FILE" \
        -alias "$ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=Ibimina ${APP_NAME^}, OU=Mobile Apps, O=Ibimina, L=Kigali, ST=Kigali City, C=RW"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Keystore generated successfully!"
        echo "   File: $KEYSTORE_FILE"
        echo "   Alias: $ALIAS"
        
        # Create environment file
        ENV_FILE="$HOME/.ibimina-${APP_NAME}-signing.env"
        cat > "$ENV_FILE" << EOF
# Ibimina $APP_NAME App Signing Configuration
# Generated: $(date)
# KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT

export ANDROID_KEYSTORE_PATH="$KEYSTORE_FILE"
export ANDROID_KEYSTORE_PASSWORD="$KEYSTORE_PASSWORD"
export ANDROID_KEY_ALIAS="$ALIAS"
export ANDROID_KEY_PASSWORD="$KEY_PASSWORD"

# For build scripts, source this file:
# source $ENV_FILE
EOF
        chmod 600 "$ENV_FILE"
        
        echo ""
        echo "✅ Environment file created: $ENV_FILE"
        echo ""
        echo "📋 To use in builds:"
        echo "   source $ENV_FILE"
        echo "   ./scripts/build-${APP_NAME}-release.sh"
        echo ""
        
        # Save credentials to a secure note format
        CREDS_FILE="$KEYSTORE_DIR/ibimina-${APP_NAME}-credentials.txt"
        cat > "$CREDS_FILE" << EOF
Ibimina $APP_NAME App - Release Signing Credentials
Generated: $(date)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  STORE THIS IN YOUR PASSWORD MANAGER (1Password, etc)
⚠️  DELETE THIS FILE AFTER STORING SECURELY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App Name: Ibimina $APP_NAME
Package: $PACKAGE_NAME
Keystore File: $KEYSTORE_FILE
Key Alias: $ALIAS

Keystore Password: $KEYSTORE_PASSWORD
Key Password: $KEY_PASSWORD

Environment File: $ENV_FILE

Certificate Details:
CN=Ibimina ${APP_NAME^}, OU=Mobile Apps, O=Ibimina, L=Kigali, ST=Kigali City, C=RW

Valid For: 10,000 days (~27 years)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKUP INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Copy keystore file to secure encrypted storage
2. Store credentials in password manager
3. Create backup copy in different physical location
4. NEVER commit keystore to git
5. If lost, you CANNOT update the app - must create new app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
        chmod 600 "$CREDS_FILE"
        
        echo "📝 Credentials saved to: $CREDS_FILE"
        echo "   ⚠️  STORE THESE IN YOUR PASSWORD MANAGER"
        echo "   ⚠️  DELETE THE FILE AFTER STORING SECURELY"
        echo ""
        
        # Show certificate info
        echo "📜 Certificate information:"
        keytool -list -v -keystore "$KEYSTORE_FILE" -storepass "$KEYSTORE_PASSWORD" | grep -A 5 "Alias name:"
        
    else
        echo "❌ Keystore generation failed!"
        return 1
    fi
    
    echo ""
}

# Generate keystores for both apps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Client App"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
generate_keystore "client" "rw.ibimina.client"

echo ""
read -p "Generate keystore for Admin/Staff app too? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "2. Admin/Staff App"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    generate_keystore "staff" "rw.ibimina.staff"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Keystore Generation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Keystores location: $KEYSTORE_DIR"
echo ""
echo "🔐 Security Checklist:"
echo "   [ ] Store credentials in password manager"
echo "   [ ] Create encrypted backup of keystores"
echo "   [ ] Delete *-credentials.txt files after storing"
echo "   [ ] Verify keystores are NOT in git"
echo "   [ ] Share backup location with team (not the keystore itself)"
echo ""
echo "📋 Next steps:"
echo "   1. Test build with new keystore:"
echo "      source ~/.ibimina-client-signing.env"
echo "      ./scripts/build-client-release.sh"
echo ""
echo "   2. Verify signature:"
echo "      jarsigner -verify -verbose -certs <apk-file>"
echo ""
echo "   3. Upload to Play Console"
echo "      Enable Play App Signing (Google manages final signing)"
echo ""
echo "📚 See MOBILE_APK_PRODUCTION_ROADMAP.md for full guide"
echo ""
