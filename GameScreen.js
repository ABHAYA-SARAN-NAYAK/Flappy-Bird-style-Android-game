import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// --- Game constants ---
const GRAVITY = 0.6;         // downward acceleration
const FLAP_STRENGTH = -9;    // upward boost power
const BIRD_SIZE = 40;        // bird square size
const GROUND_HEIGHT = 80;      // ground strip height
const PIPE_WIDTH = 60;         // pipe width
const PIPE_GAP = 150;          // gap between top and bottom pipes
const PIPE_SPEED = 2;          // pipe movement speed (pixels per frame)
const PIPE_INTERVAL = 1500;  // seconds between new pipes

const GameScreen = ({onExit, onNewHighScore}) => {
  const {width, height} = useWindowDimensions();

  // --- GAME STATE ---
  const [birdY, setBirdY] = useState(height / 2 - BIRD_SIZE / 2);
  const birdVelocity = useRef(0);  // mutable ref to track velocity without re-renders
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const pipeIdRef = useRef(0);
  const birdYRef = useRef(height / 2 - BIRD_SIZE / 2);
  const gameActiveRef = useRef(true);

  // Bird animation - rotation based on velocity
  const birdRotation = useRef(new Animated.Value(0)).current;
  const birdRotationStyle = birdRotation.interpolate({
    inputRange: [-25, 25],
    outputRange: ['-25deg', '25deg'],
  });

  // Update bird rotation based on velocity (for visual flair)
  useEffect(() => {
    if (!gameActiveRef.current) return;

    const animateRotation = () => {
      const targetRotation = Math.max(-25, Math.min(25, birdVelocity.current * -2.5));
      Animated.timing(birdRotation, {
        toValue: targetRotation,
        duration: 100,
        useNativeDriver: false,
      }).start();
    };

    const interval = setInterval(animateRotation, 100);
    return () => clearInterval(interval);
  }, []);

  // --- GAME LOOP ---
  useEffect(() => {
    gameActiveRef.current = true;

    const loop = setInterval(() => {
      // Update bird position using ref for latest value
      birdVelocity.current += GRAVITY;
      birdYRef.current = Math.max(0, Math.min(birdYRef.current + birdVelocity.current, height - GROUND_HEIGHT - BIRD_SIZE));
      setBirdY(birdYRef.current);

      // Move pipes leftward and check collisions
      setPipes(prevPipes => {
        const updated = prevPipes.map(pipe => ({...pipe, x: pipe.x - PIPE_SPEED}));

        // Find pipes gone off-screen and increase score
        const newPipes = updated.filter(pipe => pipe.x + PIPE_WIDTH > 0);
        const passedCount = updated.filter(pipe => pipe.x + PIPE_WIDTH <= 0).length;

        if (passedCount > 0) {
          setScore(s => s + passedCount);
        }

        // Collision detection using birdYRef.current
        const birdLeft = width / 2 - BIRD_SIZE / 2;
        const birdRight = width / 2 + BIRD_SIZE / 2;
        const currentBirdY = birdYRef.current;
        const birdTop = currentBirdY;
        const birdBottom = currentBirdY + BIRD_SIZE;

        const hitPipe = updated.find(pipe => {
          const pipeLeft = pipe.x;
          const pipeRight = pipe.x + PIPE_WIDTH;

          if (birdRight < pipeLeft || birdLeft > pipeRight) return false;

          return birdTop < pipe.gapTop || birdBottom > (pipe.gapTop + PIPE_GAP);
        });

        if (hitPipe || currentBirdY + BIRD_SIZE >= height - GROUND_HEIGHT) {
          setGameOver(true);
          gameActiveRef.current = false;
        }

        return newPipes;
      });
    }, 16);

    // Spawn pipes
    const spawnPipe = () => {
      if (!gameActiveRef.current) return;
      setPipes(prev => [...prev, {id: pipeIdRef.current++, x: width, gapTop: Math.random() * (height - GROUND_HEIGHT - PIPE_GAP)}]);
      setTimeout(spawnPipe, PIPE_INTERVAL);
    };

    setTimeout(spawnPipe, PIPE_INTERVAL);

    return () => {
      clearInterval(loop);
      gameActiveRef.current = false;
    };
  }, [height]);

  // Flap handler
  const flap = () => {
    if (!gameActiveRef.current) return;
    birdVelocity.current = FLAP_STRENGTH;
  };

  // Simple restart - resets all game state
  const restart = () => {
    const startY = height / 2 - BIRD_SIZE / 2;
    setBirdY(startY);
    birdYRef.current = startY;
    birdVelocity.current = 0;
    setPipes([]);
    setScore(0);
    setGameOver(false);
    gameActiveRef.current = true;
  };

  // Save high score when game ends
  useEffect(() => {
    if (gameOver && score > 0 && onNewHighScore) {
      onNewHighScore(score);
    }
  }, [gameOver, score]);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={flap}>
        <View style={[styles.playArea, {width, height}]}>
          {/* Gradient Sky background */}
          <LinearGradient
            style={[styles.gradientSky, {width, height: height - GROUND_HEIGHT}]}
            colors={['#87CEEB', '#E0F6FF']}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
          />

          {/* Pipes */}
          {pipes.map(pipe => (
            <React.Fragment key={pipe.id}>
              {/* Top pipe with lip at bottom */}
              <View style={[styles.pipeTop, {width: PIPE_WIDTH, left: pipe.x, height: pipe.gapTop, top: 0}]}>
                {/* Lip at bottom of top pipe */}
                <View style={styles.pipeLip} />
              </View>
              {/* Bottom pipe with lip at top */}
              <View style={[styles.pipeBottom, {width: PIPE_WIDTH, left: pipe.x, top: pipe.gapTop + PIPE_GAP, height: height - GROUND_HEIGHT - (pipe.gapTop + PIPE_GAP)}]}>
                {/* Lip at top of bottom pipe */}
                <View style={styles.pipeLipBottom} />
              </View>
            </React.Fragment>
          ))}

          {/* Bird with rotation animation */}
          <Animated.View
            style={[
              styles.birdContainer,
              {
                width: BIRD_SIZE,
                height: BIRD_SIZE,
                left: width / 2 - BIRD_SIZE / 2,
                top: birdY,
                transform: [{rotate: birdRotationStyle}],
              },
            ]}>
            <View style={styles.birdBody}>
              <View style={styles.birdEye} />
              <View style={styles.birdBeak} />
            </View>
          </Animated.View>

          {/* Ground with texture */}
          <View style={styles.groundContainer}>
            <View style={styles.ground} />
            <View style={styles.groundHighlight} />
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* UI overlay */}
      <Text style={styles.scoreText}>Score: {score}</Text>

      {gameOver ? (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScore}>Score: {score}</Text>
          <TouchableOpacity style={styles.restartButton} onPress={restart}>
            <Text style={styles.restartText}>Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={onExit}>
            <Text style={styles.menuText}>Menu</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, position: 'relative'},
  playArea: {position: 'relative'},
  gradientSky: {position: 'absolute', top: 0, left: 0},

  // Bird container for rotation
  birdContainer: {position: 'absolute'},
  birdBody: {
    position: 'absolute',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    backgroundColor: '#FFD700', // Golden yellow
    borderRadius: 20,
    overflow: 'hidden',
  },
  birdEye: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    left: BIRD_SIZE - 12,
    top: 8,
  },
  birdBeak: {
    position: 'absolute',
    width: 10,
    height: 6,
    backgroundColor: '#FF8C00', // Orange beak
    left: BIRD_SIZE - 2,
    top: BIRD_SIZE / 2 - 3,
    borderRadius: 3,
  },

  // Pipes with lips
  pipeTop: {position: 'absolute', backgroundColor: '#2ECC71'},
  pipeBottom: {position: 'absolute', backgroundColor: '#2ECC71'},
  pipeLip: {
    position: 'absolute',
    left: -4,
    right: 4,
    bottom: -4,
    height: 4,
    backgroundColor: '#27AE60', // Darker green for lip
  },
  pipeLipBottom: {
    position: 'absolute',
    left: -4,
    right: 4,
    top: -4,
    height: 4,
    backgroundColor: '#27AE60', // Darker green for lip
  },

  // Ground with texture
  groundContainer: {position: 'absolute', left: 0, bottom: 0, width: '100%', height: GROUND_HEIGHT},
  ground: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: GROUND_HEIGHT - 4,
    backgroundColor: '#8B5A2B',
  },
  groundHighlight: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: 4,
    backgroundColor: '#A0522D', // Sienna for highlight
  },

  scoreText: {
    position: 'absolute',
    top: 30,
    left: 20,
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 16,
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowRadius: 2,
  },
  finalScore: {
    color: '#FFD700',
    fontSize: 24,
    margin: 10,
    fontWeight: '500',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginVertical: 8,
    elevation: 3,
  },
  restartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  menuText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default GameScreen;