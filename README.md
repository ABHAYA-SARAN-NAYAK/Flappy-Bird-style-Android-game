# Flappy Bird - Android Game

A Flappy Bird-style Android game built with **Expo** and **React Native**.

## How to Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android device, or press `a` to open on an Android emulator.

## How to Play

- Tap the screen to make the bird flap upwards
- Navigate through the gaps between the green pipes
- Each pipe passed = 1 point
- Hitting a pipe or the ground ends the game
- Your high score is saved locally

## Built With

- [Expo](https://expo.dev) (SDK 54)
- [React Native](https://reactnative.dev)
- [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## Project Structure

```
App.js              — Main game logic and UI
index.js            — Entry point
assets/             — Icons and images
app.json            — Expo configuration
eas.json            — EAS Build config
```

## Build for Production

```bash
npx eas build --platform android --profile preview
```
