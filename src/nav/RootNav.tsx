import React, { type ComponentProps } from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

const TAB_BACKGROUND = "#020617"; // slate-950
const TAB_ACTIVE_TINT = "#38BDF8"; // sky-400
const TAB_INACTIVE_TINT = "#64748B"; // slate-500
const TAB_BORDER = "rgba(148, 163, 184, 0.2)"; // slate-400 with opacity
const HEADER_TEXT = "#E2E8F0"; // slate-200

export type TabParamList = {
  Home: undefined;
  Pay: undefined;
  Statements: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  GroupDetail: { groupId: string; name?: string };
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICON_MAP: Record<keyof TabParamList, ComponentProps<typeof Ionicons>["name"]> = {
  Home: "home",
  Pay: "card",
  Statements: "document-text",
  Profile: "person-circle",
};

function createPlaceholderScreen(title: string, subtitle?: string) {
  return function PlaceholderScreen() {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </SafeAreaView>
    );
  };
}

const HomeScreen = createPlaceholderScreen("Home", "Monitor balances, contributions, and news.");
const PayScreen = createPlaceholderScreen("Pay", "Send payments or contributions in a tap.");
const StatementsScreen = createPlaceholderScreen(
  "Statements",
  "Review your transaction history and exports."
);
const ProfileScreen = createPlaceholderScreen(
  "Profile",
  "Manage your personal details and settings."
);
const GroupDetailScreen = createPlaceholderScreen(
  "Group Detail",
  "Inspect group activity, members, and savings."
);

type GroupDetailRoute = NativeStackScreenProps<RootStackParamList, "GroupDetail">["route"];

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: TAB_ACTIVE_TINT,
        tabBarInactiveTintColor: TAB_INACTIVE_TINT,
        tabBarStyle: {
          backgroundColor: TAB_BACKGROUND,
          borderTopColor: TAB_BORDER,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICON_MAP[route.name as keyof TabParamList];
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      sceneContainerStyle={{ backgroundColor: TAB_BACKGROUND }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pay" component={PayScreen} />
      <Tab.Screen name="Statements" component={StatementsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNav() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: TAB_BACKGROUND,
        },
        headerTintColor: HEADER_TEXT,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
        },
        contentStyle: {
          backgroundColor: TAB_BACKGROUND,
        },
      }}
    >
      <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={({ route }: { route: GroupDetailRoute }) => ({
          title: route.params?.name ?? "Group Detail",
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: TAB_BACKGROUND,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: HEADER_TEXT,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#CBD5F5",
    textAlign: "center",
  },
});
