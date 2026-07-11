# Flappy Bird - React Native (Expo)

A Flappy Bird-style Android game built with React Native and Expo.

## How to Run

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or press `a` to open on an Android emulator.

## How to Play

- Tap anywhere on the screen to make the bird flap upward
- Avoid hitting pipes and the ground
- Each pipe passed scores 1 point
- Try to beat your best score!

## Tech Stack

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## Game Features

- Gravity-based bird physics
- Procedurally generated pipes
- Score tracking with local persistence (AsyncStorage)
- Game over / restart flow
- Background gradient sky
- Animated bird rotation
