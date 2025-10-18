# Pawnder - Pet Dating App (FE-User)

React Native application for Pawnder Pet Dating App.

## Prerequisites

- Node.js >= 18
- Java JDK 17 or higher
- Android Studio with Android SDK (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS (macOS only):
```bash
cd ios && pod install && cd ..
```

## Running the App

### Android

Make sure you have an Android emulator running or a physical device connected.

```bash
npm run android
```

### iOS (macOS only)

```bash
npm run ios
```

## Development

### Start Metro Bundler

```bash
npm start
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm test
```

## Troubleshooting

### Android Build Issues

If you encounter build issues on Android:

1. Clean the build:
```bash
cd android && ./gradlew clean && cd ..
```

2. Clear Metro cache:
```bash
npm start -- --reset-cache
```

3. Delete node_modules and reinstall:
```bash
rm -rf node_modules && npm install
```

### Vector Icons not showing

If vector icons are not displaying:

```bash
npx react-native-asset
```

## Project Structure

```
src/
├── api/          # API calls and services
├── app/          # Redux store setup
├── assets/       # Images, fonts, and other static files
├── components/   # Reusable components
├── features/     # Feature-based modules
├── navigation/   # Navigation configuration
├── theme/        # Theme colors and styles
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

## Technologies Used

- React Native 0.74.3
- TypeScript
- React Navigation
- Redux Toolkit
- SignalR for real-time communication
- Axios for HTTP requests
- React Native Vector Icons
- React Native Linear Gradient
- React Native Keychain (for secure storage)

