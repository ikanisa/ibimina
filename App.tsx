import "react-native-reanimated";
import React from "react";
import { NavigationContainer, DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";
import { useColorScheme } from "react-native";

import RootNav from "./src/nav/RootNav";

const APP_BACKGROUND = "#020617"; // slate-950
const PRIMARY_COLOR = "#38BDF8"; // sky-400
const BORDER_COLOR = "rgba(148, 163, 184, 0.2)"; // slate-400 with opacity
const LIGHT_TEXT = "#E2E8F0"; // slate-200
const DARK_TEXT = "#94A3B8"; // slate-400

export default function App() {
  const colorScheme = useColorScheme();

  const theme: Theme = React.useMemo(() => {
    const isDark = colorScheme === "dark";
    const baseTheme = isDark ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: APP_BACKGROUND,
        card: APP_BACKGROUND,
        border: BORDER_COLOR,
        primary: PRIMARY_COLOR,
        text: isDark ? LIGHT_TEXT : DARK_TEXT,
      },
    };
  }, [colorScheme]);

  return (
    <NavigationContainer theme={theme}>
      <RootNav />
    </NavigationContainer>
  );
}
