import { Animated, Easing } from "react-native";

export const fadeIn = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

export const fadeOut = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

export const slideIn = (value: Animated.Value, from: number, duration = 300) => {
  return Animated.spring(value, {
    toValue: 0,
    useNativeDriver: true,
    tension: 65,
    friction: 10,
  });
};

export const slideOut = (value: Animated.Value, to: number, duration = 300) => {
  return Animated.timing(value, {
    toValue: to,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

export const scaleIn = (value: Animated.Value, duration = 300) => {
  return Animated.spring(value, {
    toValue: 1,
    useNativeDriver: true,
    tension: 100,
    friction: 8,
  });
};

export const scaleOut = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

export const pulse = (value: Animated.Value, duration = 1000) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.1,
        duration: duration / 2,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ])
  );
};

export const shake = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, { toValue: 10, duration: 100, useNativeDriver: true }),
    Animated.timing(value, { toValue: -10, duration: 100, useNativeDriver: true }),
    Animated.timing(value, { toValue: 10, duration: 100, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: 100, useNativeDriver: true }),
  ]);
};
