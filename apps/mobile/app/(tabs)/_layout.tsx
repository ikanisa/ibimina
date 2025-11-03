/**
 * Bottom tabs layout with 5 navigation routes
 * Uses Ionicons for accessible, scalable tab bar icons
 */

import { Redirect, Tabs } from "expo-router";
import { useIntl } from "react-intl";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme";
import { useAppStore } from "../../src/providers/store";

// Tab bar icons using Ionicons for accessibility and proper scaling
function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    home: focused ? "home" : "home-outline",
    pay: focused ? "card" : "card-outline",
    statements: focused ? "document-text" : "document-text-outline",
    offers: focused ? "gift" : "gift-outline",
    profile: focused ? "person" : "person-outline",
  };

  const iconName = iconMap[name] || "ellipse-outline";

  return (
    <Ionicons name={iconName} size={24} color={focused ? colors.atlas.blue : colors.neutral[500]} />
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
        tabBarActiveTintColor: colors.atlas.blue,
        tabBarInactiveTintColor: colors.neutral[500],
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
