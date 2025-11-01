/**
 * Bottom tabs layout with 5 navigation routes
 */

import { Redirect, Tabs } from "expo-router";
import { useIntl } from "react-intl";
import { colors } from "../../src/theme";
import { useAppStore } from "../../src/providers/store";

// Simple icon placeholders using emoji
function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: "🏠",
    pay: "💳",
    statements: "📊",
    offers: "🎁",
    profile: "👤",
  };

  return {
    children: icons[name] || "○",
    style: {
      fontSize: 24,
      opacity: focused ? 1 : 0.6,
    },
  };
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
        tabBarActiveTintColor: colors.rw.blue,
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
