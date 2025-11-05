import React from "react";
import Ionicons from "react-native-vector-icons/Ionicons";

interface TabBarIconProps {
  name: string;
  color: string;
  size?: number;
}

export function TabBarIcon({ name, color, size = 24 }: TabBarIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
