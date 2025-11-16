import React, { type ComponentProps } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useNativeWindTheme } from "@theme/nativewind";

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
    const theme = useNativeWindTheme();

    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: theme.palette.background }]}
        className={theme.classes.background}
      >
        <Text style={styles.title} className={`${theme.classes.textPrimary} text-center`}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} className={`${theme.classes.textSecondary} text-center`}>
            {subtitle}
          </Text>
        ) : null}
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
  const theme = useNativeWindTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.palette.primary,
        tabBarInactiveTintColor: theme.palette.textDefault,
        tabBarStyle: {
          backgroundColor: theme.palette.card,
          borderTopColor: theme.palette.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarLabel: ({ focused, color }) => (
          <Text
            className={focused ? theme.classes.tabBar.active : theme.classes.tabBar.label}
            accessibilityRole="text"
            accessibilityLabel={`${route.name} tab`}
          >
            {route.name}
          </Text>
        ),
        tabBarAccessibilityLabel: `${route.name} tab`,
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICON_MAP[route.name as keyof TabParamList];
          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
              accessibilityLabel={`${route.name} icon`}
            />
          );
        },
      })}
      sceneContainerStyle={{ backgroundColor: theme.palette.background }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pay" component={PayScreen} />
      <Tab.Screen name="Statements" component={StatementsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNav() {
  const theme = useNativeWindTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.palette.card,
        },
        headerTintColor: theme.palette.textOnPrimary,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
        },
        contentStyle: {
          backgroundColor: theme.palette.background,
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
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
