import "react-native-reanimated";
import React from "react";
import { NavigationContainer, DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";
import { useColorScheme } from "react-native";

import RootNav from "./src/nav/RootNav";
import { getMinimalTheme } from "./src/styles/tokens";

export default function App() {
  const colorScheme = useColorScheme();

  const theme: Theme = React.useMemo(() => {
    const isDark = colorScheme === "dark";
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    const minimalTheme = getMinimalTheme(isDark ? "dark" : "light");

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: minimalTheme.colors.background,
        card: minimalTheme.colors.surface,
        border: minimalTheme.colors.border,
        primary: minimalTheme.colors.primary,
        text: isDark ? minimalTheme.colors.text : minimalTheme.colors.textMuted,
      },
    };
  }, [colorScheme]);

  return (
    <NavigationContainer theme={theme}>
      <RootNav />
    </NavigationContainer>
  );
}
