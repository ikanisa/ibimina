# iOS Release Build

## Prerequisites

1. Apple Developer Account
2. App Store Connect app created
3. Provisioning profile downloaded
4. Xcode installed

## Steps

1. Open `ios/IbiminaClient.xcworkspace` in Xcode

2. Select "Any iOS Device" as target

3. Select Product → Archive

4. Once archived, click "Distribute App"

5. Choose distribution method:
   - App Store Connect (for TestFlight/App Store)
   - Ad Hoc (for testing on specific devices)
   - Enterprise (if you have Enterprise account)

6. Follow the wizard to upload to App Store Connect

## TestFlight

After upload:
1. Log into App Store Connect
2. Go to TestFlight section
3. Add internal/external testers
4. Submit for review (external only)

## App Store Release

1. Create new version in App Store Connect
2. Fill in all required metadata
3. Add screenshots (use screenshot tool)
4. Submit for review
5. Wait for approval (1-2 days typically)
