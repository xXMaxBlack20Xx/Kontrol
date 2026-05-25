import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BLUE_PALETTE = [
  '#007AFF', // System Blue
  '#5AC8FA', // Light Blue
  '#0050CB', // Deep Navy Blue
  '#34C759', // Accent Green-Teal
  '#5856D6', // Accent Indigo-Blue
];

const CONFETTI_COUNT = 60; // Optimized particle count

interface ConfettiPieceProps {
  color: string;
  index: number;
  onAnimationEnd: () => void;
}

const ConfettiPiece = React.memo(function ConfettiPiece({ color, index, onAnimationEnd }: ConfettiPieceProps) {
  const y = useSharedValue(-50);
  const x = useSharedValue(Math.random() * SCREEN_WIDTH);
  const rotation = useSharedValue(Math.random() * 360);
  const rotationX = useSharedValue(Math.random() * 360);
  const scale = useSharedValue(0.4 + Math.random() * 0.8); // Wider scale variation

  const onAnimationEndRef = useRef(onAnimationEnd);
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
  }, [onAnimationEnd]);

  const triggerEnd = useCallback(() => {
    onAnimationEndRef.current();
  }, []);

  useEffect(() => {
    // Faster fall speed to create the illusion of high volume while offloading animations natively
    const duration = 1600 + Math.random() * 1000;
    const delay = Math.random() * 500; // Shorter delay spread

    y.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 50, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }, (isFinished) => {
        if (isFinished && index === 0) {
          runOnJS(triggerEnd)();
        }
      })
    );

    x.value = withDelay(
      delay,
      withTiming(x.value + (Math.random() - 0.5) * 200, {
        duration,
        easing: Easing.linear,
      })
    );

    rotation.value = withDelay(
      delay,
      withTiming(rotation.value + (Math.random() - 0.5) * 720, {
        duration,
        easing: Easing.linear,
      })
    );

    rotationX.value = withDelay(
      delay,
      withTiming(rotationX.value + (Math.random() - 0.5) * 1080, {
        duration,
        easing: Easing.linear,
      })
    );
  }, [index, triggerEnd, x, y, rotation, rotationX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: y.value },
        { translateX: x.value },
        { rotate: `${rotation.value}deg` },
        { rotateX: `${rotationX.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const isCircle = index % 3 === 0;
  // Varied sizes
  const width = isCircle ? 10 : (index % 2 === 0 ? 8 : 12);
  const height = isCircle ? 10 : (index % 2 === 0 ? 12 : 16);

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          backgroundColor: color,
          borderRadius: isCircle ? width / 2 : 2,
          width,
          height,
        },
        animatedStyle,
      ]}
    />
  );
});

interface ConfettiProps {
  active: boolean;
  onAnimationEnd: () => void;
}

export const Confetti = React.memo(function Confetti({ active, onAnimationEnd }: ConfettiProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (active) {
      setKey((prev) => prev + 1);
    }
  }, [active]);

  if (!active) return null;

  return (
    <View key={key} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
        const color = BLUE_PALETTE[i % BLUE_PALETTE.length];
        return (
          <ConfettiPiece
            key={i}
            color={color}
            index={i}
            onAnimationEnd={onAnimationEnd}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
});
