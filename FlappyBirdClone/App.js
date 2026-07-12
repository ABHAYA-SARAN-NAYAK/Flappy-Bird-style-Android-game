import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BIRD_SIZE = 38;
const GRAVITY = 0.32;
const FLAP_STRENGTH = -6.5;
const GROUND_HEIGHT = 80;
const PIPE_WIDTH = 60;
const PIPE_GAP = 190;
const PIPE_SPEED = 2.2;
const PIPE_INTERVAL = 1900;

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [birdY, setBirdY] = useState(SCREEN_HEIGHT / 2 - BIRD_SIZE / 2);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [pipes, setPipes] = useState([]);
  const birdVelocity = useRef(0);
  const birdYRef = useRef(SCREEN_HEIGHT / 2 - BIRD_SIZE / 2);
  const gameActiveRef = useRef(false);
  const intervalId = useRef(null);
  const pipesRef = useRef([]);
  const scoreRef = useRef(0);

  useEffect(() => {
    loadBestScore();
  }, []);

  const loadBestScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('bestScore');
      if (saved !== null) {
        setBestScore(parseInt(saved, 10));
      }
    } catch (e) {
      console.log('Failed to load best score');
    }
  };

  const saveBestScore = async (newScore) => {
    try {
      await AsyncStorage.setItem('bestScore', newScore.toString());
    } catch (e) {
      console.log('Failed to save best score');
    }
  };

  const checkCollision = (birdRect, pipe) => {
    const topPipeBottom = pipe.gapCenterY - PIPE_GAP / 2;
    const bottomPipeTop = pipe.gapCenterY + PIPE_GAP / 2;

    const birdLeft = birdRect.x;
    const birdRight = birdRect.x + birdRect.width;
    const birdTop = birdRect.y;
    const birdBottom = birdRect.y + birdRect.height;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
        return true;
      }
    }
    return false;
  };

  const gameLoop = (delta) => {
    if (!gameActiveRef.current) return;

    birdVelocity.current += GRAVITY * delta;
    birdVelocity.current = Math.min(birdVelocity.current, 7);
    birdYRef.current = Math.max(0, Math.min(birdYRef.current + birdVelocity.current * delta, SCREEN_HEIGHT - GROUND_HEIGHT - BIRD_SIZE));
    setBirdY(birdYRef.current);

    if (birdYRef.current >= SCREEN_HEIGHT - GROUND_HEIGHT - BIRD_SIZE) {
      endGame();
      return;
    }

    const birdRect = {
      x: SCREEN_WIDTH / 2 - BIRD_SIZE / 2,
      y: birdYRef.current,
      width: BIRD_SIZE,
      height: BIRD_SIZE,
    };

    let newPipes = pipesRef.current.map(p => ({ ...p, x: p.x - PIPE_SPEED * delta }));
    newPipes = newPipes.filter(p => p.x + PIPE_WIDTH > 0);

    if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < SCREEN_WIDTH - 300) {
      const minGapY = 100;
      const maxGapY = SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100;
      const gapCenterY = Math.random() * (maxGapY - minGapY) + minGapY;
      newPipes.push({ x: SCREEN_WIDTH, gapCenterY, passed: false });
    }

    for (const pipe of newPipes) {
      if (!pipe.passed && pipe.x + PIPE_WIDTH < birdRect.x) {
        pipe.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    }

    for (const pipe of newPipes) {
      if (checkCollision(birdRect, pipe)) {
        endGame();
        return;
      }
    }

    pipesRef.current = newPipes;
    setPipes([...newPipes]);
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setBirdY(SCREEN_HEIGHT / 2 - BIRD_SIZE / 2);
    setScore(0);
    setPipes([]);
    birdVelocity.current = 0;
    birdYRef.current = SCREEN_HEIGHT / 2 - BIRD_SIZE / 2;
    scoreRef.current = 0;
    pipesRef.current = [];
    gameActiveRef.current = true;
  };

  const endGame = () => {
    setGameOver(true);
    gameActiveRef.current = false;
    const finalScore = scoreRef.current;
    if (finalScore > bestScore) {
      setBestScore(finalScore);
      saveBestScore(finalScore);
    }
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  const handleTap = () => {
    if (!gameStarted || gameOver) return;
    birdVelocity.current = FLAP_STRENGTH;
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    gameActiveRef.current = true;
    let lastTime = Date.now();

    intervalId.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTime) / 16.67;
      lastTime = now;
      gameLoop(delta);
    }, 16);

    return () => {
      gameActiveRef.current = false;
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
    };
  }, [gameStarted, gameOver]);

  if (!gameStarted) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.title}>Flappy Bird</Text>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Current Score</Text>
            <Text style={styles.scoreValue}>0</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Best Score</Text>
            <Text style={styles.scoreValue}>{bestScore}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
        <StatusBar style="light" />
      </LinearGradient>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <LinearGradient colors={['#4dc9f6', '#87CEEB', '#B0E0E6']} style={styles.gameContainer}>
        <StatusBar style="light" hidden />

        {/* Pipes */}
        {pipes.map((pipe, index) => (
          <View key={index}>
            <View style={[styles.pipe, {
              top: 0,
              height: pipe.gapCenterY - PIPE_GAP / 2,
              left: pipe.x,
            }]}>
              <View style={[styles.pipeLip, {
                bottom: 0,
                left: -5,
                width: PIPE_WIDTH + 10,
                height: 20,
              }]} />
            </View>
            <View style={[styles.pipe, {
              top: pipe.gapCenterY + PIPE_GAP / 2,
              height: SCREEN_HEIGHT - (pipe.gapCenterY + PIPE_GAP / 2) - GROUND_HEIGHT,
              left: pipe.x,
            }]}>
              <View style={[styles.pipeLip, {
                top: 0,
                left: -5,
                width: PIPE_WIDTH + 10,
                height: 20,
              }]} />
            </View>
          </View>
        ))}

        {/* Bird */}
        <View style={[styles.birdContainer, {
          top: birdY,
          transform: [{ rotate: `${birdVelocity.current > 5 ? 45 : birdVelocity.current < -2 ? -20 : birdVelocity.current * 4}deg` }]
        }]}>
          <View style={styles.birdBody} />
          <View style={styles.birdBeak} />
          <View style={styles.birdEye}>
            <View style={styles.birdPupil} />
          </View>
          <View style={styles.birdWing} />
        </View>

        {/* Score */}
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>

        {/* Ground */}
        <View style={styles.ground}>
          <View style={styles.grassStrip} />
        </View>

        {/* Game Over */}
        {gameOver && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>Game Over</Text>
            <Text style={styles.finalScoreText}>Score: {score}</Text>
            <Text style={styles.bestScoreText}>Best: {bestScore}</Text>
            <TouchableOpacity style={styles.restartButton} onPress={startGame}>
              <Text style={styles.restartButtonText}>Restart</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 60,
    letterSpacing: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    marginBottom: 60,
    gap: 30,
  },
  scoreBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    minWidth: 130,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#aaaacc',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  gameContainer: {
    flex: 1,
  },
  birdContainer: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - 20,
    width: 40,
    height: 30,
  },
  birdBody: {
    position: 'absolute',
    width: 30,
    height: 24,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    top: 3,
    left: 5,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  birdBeak: {
    position: 'absolute',
    top: 10,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FF6B35',
  },
  birdEye: {
    position: 'absolute',
    top: 6,
    left: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  birdPupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  birdWing: {
    position: 'absolute',
    top: 10,
    left: 8,
    width: 14,
    height: 10,
    backgroundColor: '#FFA500',
    borderRadius: 7,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: GROUND_HEIGHT,
    backgroundColor: '#8B4513',
    borderTopWidth: 4,
    borderTopColor: '#5D2E0C',
  },
  grassStrip: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 8,
    backgroundColor: '#4CAF50',
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: '#2ECC71',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#1B8C4A',
  },
  pipeLip: {
    position: 'absolute',
    backgroundColor: '#27AE60',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1B8C4A',
  },
  scoreBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  finalScoreText: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 10,
  },
  bestScoreText: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 40,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  restartButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
