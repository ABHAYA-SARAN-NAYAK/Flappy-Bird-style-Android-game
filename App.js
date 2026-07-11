import React, {useState, useEffect} from 'react';
import {StatusBar} from 'expo-status-bar';
import {StyleSheet, SafeAreaView, View, Text, TouchableOpacity, useWindowDimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GameScreen from './GameScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [bestScore, setBestScore] = useState(0);
  const {height} = useWindowDimensions();

  useEffect(() => {
    // Load best score from AsyncStorage when the app starts
    loadBestScore();
  }, []);

  const loadBestScore = async () => {
    try {
      const storedScore = await AsyncStorage.getItem('bestScore');
      if (storedScore) {
        setBestScore(JSON.parse(storedScore));
      }
    } catch (error) {
      console.error('Error loading best score:', error);
    }
  };

  const saveBestScore = async (newScore) => {
    try {
      await AsyncStorage.setItem('bestScore', JSON.stringify(newScore));
      setBestScore(newScore);
    } catch (error) {
      console.error('Error saving best score:', error);
    }
  };

  const HomeScreen = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Flappy Bird</Text>
        <Text style={styles.score}>Current Score: 0</Text>
        <Text style={styles.bestScore}>Best Score: {bestScore}</Text>
        <TouchableOpacity style={styles.startButton} onPress={() => setCurrentScreen('game')}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (currentScreen === 'game') {
    return <GameScreen onExit={() => setCurrentScreen('home')} onNewHighScore={saveBestScore} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <HomeScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowRadius: 2,
  },
  score: {
    fontSize: 24,
    margin: 10,
    color: 'white',
    textAlign: 'center',
  },
  bestScore: {
    fontSize: 24,
    margin: 10,
    color: '#FFD400',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  startButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});