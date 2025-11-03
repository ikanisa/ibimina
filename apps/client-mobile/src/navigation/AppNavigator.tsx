import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useAppStore } from "../store";
import { LoadingScreen } from "../screens/LoadingScreen";

// Auth screens
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";

// Main tabs
import { HomeScreen } from "../screens/home/HomeScreen";
import { AccountsScreen } from "../screens/accounts/AccountsScreen";
import { GroupsScreen } from "../screens/groups/GroupsScreen";
import { LoansScreen } from "../screens/loans/LoansScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";

// Detail screens
import { TransactionHistoryScreen } from "../screens/accounts/TransactionHistoryScreen";
import { DepositScreen } from "../screens/accounts/DepositScreen";
import { WithdrawScreen } from "../screens/accounts/WithdrawScreen";
import { TransferScreen } from "../screens/accounts/TransferScreen";
import { GroupDetailScreen } from "../screens/groups/GroupDetailScreen";
import { LoanApplicationScreen } from "../screens/loans/LoanApplicationScreen";
import { LoanDetailScreen } from "../screens/loans/LoanDetailScreen";
import { NotificationsScreen } from "../screens/profile/NotificationsScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { HelpScreen } from "../screens/profile/HelpScreen";

// Icons
import { TabBarIcon } from "../components/TabBarIcon";
import { colors } from "../theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="wallet" color={color} />,
          tabBarLabel: "Accounts",
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="people" color={color} />,
          tabBarLabel: "Groups",
        }}
      />
      <Tab.Screen
        name="Loans"
        component={LoansScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="document-text" color={color} />,
          tabBarLabel: "Loans",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Stack.Screen name="Deposit" component={DepositScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="LoanApplication" component={LoanApplicationScreen} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAppStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>{isAuthenticated ? <MainStack /> : <AuthStack />}</NavigationContainer>
  );
}
