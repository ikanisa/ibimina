import React, { type ComponentProps } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { getMinimalTheme } from "../styles/tokens";

export type TabParamList = {
  Overview: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICON_MAP: Record<keyof TabParamList, ComponentProps<typeof Ionicons>["name"]> = {
  Overview: "home-outline",
  Profile: "person-circle-outline",
};

function createPlaceholderScreen(title: string, subtitle?: string) {
  return function PlaceholderScreen() {
    const colorScheme = useColorScheme();
    const theme = getMinimalTheme(colorScheme === "dark" ? "dark" : "light");

    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          contentContainerStyle={[styles.screenContent, { padding: theme.spacing.xl }]}
          accessibilityRole="summary"
          accessibilityLabel={`${title} screen`}
        >
          <View style={styles.textStack}>
            <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };
}

const OverviewScreen = createPlaceholderScreen(
  "Overview",
  "Stay on top of balances, goals, and group activity."
);
const ProfileScreen = createPlaceholderScreen(
  "Profile",
  "Manage your personal details, preferences, and security."
);

function TabsNavigator() {
  const colorScheme = useColorScheme();
  const theme = getMinimalTheme(colorScheme === "dark" ? "dark" : "light");

  const tabOptions: BottomTabNavigationOptions = ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textMuted,
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "600",
    },
    tabBarAccessibilityLabel: `${route.name} tab`,
    tabBarIcon: ({ color, size }) => {
      const iconName = TAB_ICON_MAP[route.name as keyof TabParamList];
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      height: 72,
      paddingBottom: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    sceneContainerStyle: {
      backgroundColor: theme.colors.background,
    },
  });

  return (
    <Tab.Navigator screenOptions={tabOptions} backBehavior="history">
      <Tab.Screen name="Overview" component={OverviewScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNav() {
  return <TabsNavigator />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textStack: {
    maxWidth: 520,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 8,
  },
});
