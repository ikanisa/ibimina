/**
 * Bottom tabs layout with 5 navigation routes
 * WCAG 2.2 AA Compliant - Using proper icons with accessible labels
 */

import { Redirect, Tabs } from "expo-router";
import { useIntl } from "react-intl";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme";
import { useAppStore } from "../../src/providers/store";

/**
 * Accessible tab bar icon component
 * Uses Ionicons for proper scaling and accessibility
 * Contrast: colors.rw.blueAccessible (#33B8F0) on ink[900] = 4.8:1 ✅
 */
function TabBarIcon({ name, focused }: { name: keyof typeof iconMap; focused: boolean }) {
  const iconMap = {
    home: focused ? "home" : "home-outline",
    pay: focused ? "card" : "card-outline",
    statements: focused ? "bar-chart" : "bar-chart-outline",
    offers: focused ? "gift" : "gift-outline",
    profile: focused ? "person" : "person-outline",
  } as const;

  return (
    <Ionicons
      name={iconMap[name] as any}
      size={24}
      color={focused ? colors.rw.blueAccessible : colors.neutral[400]}
      accessibilityLabel={`${name} tab`}
      accessibilityRole="button"
    />
  );
}

export default function TabsLayout() {
  const intl = useIntl();
  const { isAuthenticated, hasHydratedAuth } = useAppStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    hasHydratedAuth: state.hasHydratedAuth,
  }));

  if (!hasHydratedAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/start" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.rw.blueAccessible, // ✅ WCAG AA: 4.8:1 contrast on ink[900]
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.ink[900],
          borderTopColor: colors.ink[700],
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        // Accessibility improvements
        tabBarAccessibilityLabel: "Navigation tabs",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: intl.formatMessage({ id: "nav.home", defaultMessage: "Home" }),
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: intl.formatMessage({ id: "nav.pay", defaultMessage: "Pay" }),
          tabBarIcon: ({ focused }) => <TabBarIcon name="pay" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="statements"
        options={{
          title: intl.formatMessage({ id: "nav.statements", defaultMessage: "Statements" }),
          tabBarIcon: ({ focused }) => <TabBarIcon name="statements" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: intl.formatMessage({ id: "nav.offers", defaultMessage: "Offers" }),
          tabBarIcon: ({ focused }) => <TabBarIcon name="offers" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: intl.formatMessage({ id: "nav.profile", defaultMessage: "Profile" }),
          tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
