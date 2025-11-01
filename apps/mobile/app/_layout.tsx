import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProviders } from "../src/app";
import "../global.css";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="assist" options={{ title: "Ibimina Assist" }} />
      </Stack>
    </AppProviders>
  );
}
