import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const HomeScreen = () => {
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flappy Bird</Text>
      <Text style={styles.score}>Current Score: {score}</Text>
      <Text style={styles.bestScore}>Best Score: {bestScore}</Text>
      <TouchableOpacity style={styles.startButton} onPress={() => alert('Game Started!')}>
        <Text>Start Game</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 20},
  title: {fontSize: 32, fontWeight: 'bold', marginBottom: 20},
  score: {fontSize: 24, margin: 10},
  bestScore: {fontSize: 24, margin: 10},
  startButton: {backgroundColor: '#4CAF50', padding: 20, borderRadius: 10, alignItems: 'center'},
  startButtonText: {color: 'white', fontSize: 20}
});
export default HomeScreen;
