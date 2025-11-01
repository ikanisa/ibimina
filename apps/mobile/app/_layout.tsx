import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ReactQueryProvider } from "../src/providers/query-client";
import { SupabaseProvider } from "../src/providers/supabase-client";

function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <SupabaseProvider>
        <ReactQueryProvider>
          <StatusBar style="light" />
          {children}
        </ReactQueryProvider>
      </SupabaseProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="assist" options={{ title: "Ibimina Assist" }} />
      </Stack>
    </Providers>
  );
}
