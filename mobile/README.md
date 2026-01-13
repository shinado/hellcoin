# Hellcoin Mobile App

A React Native mobile app for Hellcoin - the meme coin burning hyperinflation in hell 🔥

## Features

- **Burn Screen**: Connect your Phantom wallet and burn $HELL tokens to deceased loved ones
- **Distribution**: View token distribution pie chart and top holders leaderboard
- **Blog**: Read articles about Hellcoin and the underworld economy

## Tech Stack

- **Expo** - React Native framework
- **Expo Router** - File-based routing
- **NativeWind** - Tailwind CSS for React Native
- **Solana Web3.js** - Blockchain interactions
- **React Native Chart Kit** - Distribution charts

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd mobile
npm install
```

### Running the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Burn screen
│   │   ├── distribution.tsx
│   │   └── blog/          # Blog screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── contexts/              # React contexts (Wallet)
├── services/              # API service layer
├── utils/                 # Utility functions
├── data/                  # Static data (blog posts)
└── assets/                # Images, fonts, videos
```

## API Configuration

The app connects to the Next.js API deployed at `https://hellcoin.money`. 

To use a different API URL, set the `EXPO_PUBLIC_API_URL` environment variable:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000 npm start
```

## Wallet Integration

The app uses the official [Solana Mobile Wallet Adapter](https://github.com/solana-mobile/mobile-wallet-adapter) for secure wallet connections.

### How It Works

1. User taps "Connect Wallet"
2. Mobile Wallet Adapter opens the installed wallet app (Phantom, Solflare, etc.)
3. User authorizes the connection
4. App receives the public key and can sign transactions

### Supported Wallets

- Phantom
- Solflare
- Any wallet that supports Solana Mobile Wallet Adapter protocol

### Requirements

- A Solana wallet app must be installed on the device
- Android: Works natively with Mobile Wallet Adapter
- iOS: Requires wallet apps that support the MWA protocol

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Run on Android device
npx expo run:android
```

## License

MIT
