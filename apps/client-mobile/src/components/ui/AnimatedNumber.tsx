import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { colors, typography } from "../../theme";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: any;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  style,
  prefix = "",
  suffix = "",
  decimals = 0,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(0);

  useEffect(() => {
    animatedValue.addListener(({ value: newValue }) => {
      displayValue.current = newValue;
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeAllListeners();
    };
  }, [value]);

  return (
    <Animated.Text style={[styles.text, style]}>
      {prefix}
      {animatedValue.interpolate({
        inputRange: [0, value],
        outputRange: ["0", value.toFixed(decimals)],
      })}
      {suffix}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: typography.h2,
    fontWeight: "600",
    color: colors.gray900,
  },
});
