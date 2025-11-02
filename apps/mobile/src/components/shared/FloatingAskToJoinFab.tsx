/**
 * Floating action button to ask to join a group
 */

import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
} from "react-native-reanimated";
import { useEffect } from "react";
import { elevation, colors } from "../../theme";

interface FloatingAskToJoinFabProps {
  onPress: () => void;
  label?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function FloatingAskToJoinFab({
  onPress,
  label = "Ask to Join",
}: FloatingAskToJoinFabProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Gentle pulse animation
    scale.value = withRepeat(withSpring(1.05, { damping: 2, stiffness: 80 }), -1, true);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedTouchable style={[styles.fab, animatedStyle]} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[colors.warm[500], colors.warm[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    borderRadius: 28,
    ...elevation[4],
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
