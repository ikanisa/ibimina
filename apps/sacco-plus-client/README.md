# SACCO Plus Client

A mobile application built with Expo and React Native for SACCO (Savings and
Credit Cooperative) services.

## Setup

This app has been configured with all required navigation and UI dependencies:

### Navigation Dependencies

- `@react-navigation/native` - Core navigation library
- `@react-navigation/native-stack` - Native stack navigator
- `@react-navigation/bottom-tabs` - Bottom tab navigator
- `react-native-screens` - Native screens support
- `react-native-safe-area-context` - Safe area handling
- `react-native-gesture-handler` - Gesture support
- `react-native-reanimated` - Animation library

### Visual Dependencies

- `expo-linear-gradient` - Linear gradient support
- `expo-blur` - Blur effects
- `@expo/vector-icons` - Icon library
- `dayjs` - Date/time manipulation

## Configuration

### Babel Configuration

The `babel.config.js` includes the Reanimated plugin as required:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

### Entry Point

The `index.js` imports `react-native-gesture-handler` first, as required:

```javascript
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import App from "./App";
registerRootComponent(App);
```

## Running the App

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## Demo Features

The current `App.js` includes a demo that showcases all installed dependencies:

- Navigation with Stack and Tab navigators
- Animated components with Reanimated
- Linear gradients
- Blur effects
- Vector icons
- Date formatting with dayjs

## Project Structure

```
apps/sacco-plus-client/
├── App.js              # Main app component with demo
├── index.js            # Entry point (imports gesture-handler first)
├── babel.config.js     # Babel config with Reanimated plugin
├── app.config.js       # Expo configuration with environment support
├── package.json        # Dependencies
└── assets/             # App assets (icons, splash screens)
```

## Next Steps

1. Replace the demo App.js with your actual application screens
2. Set up proper navigation structure for your SACCO features
3. Add authentication flows
4. Integrate with backend APIs
5. Add offline support as needed

## Environment

Set the following environment variables when building with EAS:

```bash
# Expo project identifiers
EAS_PROJECT_ID=your-eas-project-id
EAS_PROJECT_ID_SACCO=your-eas-project-id

# Bundle identifiers
IOS_BUNDLE_IDENTIFIER=com.ibimina.saccoplus
ANDROID_APPLICATION_ID=rw.ibimina.saccoplus

# API configuration (optional)
EXPO_PUBLIC_API_BASE_URL=https://api.ibimina.rw
EXPO_PUBLIC_API_BASE_URL_SACCO=https://api.ibimina.rw
```

`EAS_PROJECT_ID` is used locally by the Expo CLI, while `EAS_PROJECT_ID_SACCO`
is injected automatically from the EAS build profiles.
