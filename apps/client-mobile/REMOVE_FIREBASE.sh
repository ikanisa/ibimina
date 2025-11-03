#!/bin/bash
set -e

echo "🗑️  Removing Firebase dependencies..."

# Remove Firebase packages
npm uninstall @react-native-firebase/app @react-native-firebase/messaging

# Remove Firebase files
rm -f android/app/google-services.json.example
rm -f ios/GoogleService-Info.plist.example
rm -f src/services/firebase.ts
rm -f FIREBASE_SETUP.md

# Update package.json to use Supabase push notifications
npm install --save @supabase/supabase-js@latest

echo "✅ Firebase removed successfully!"
echo ""
echo "📱 Using Supabase + Native Push Notifications instead:"
echo "   - Push tokens stored in Supabase"
echo "   - Notifications sent via Supabase Edge Functions"
echo "   - Uses Expo Push Notification service (free tier)"
echo ""
