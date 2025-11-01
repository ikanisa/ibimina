/**
 * Profile screen - User profile and settings
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import { useQuery } from "@tanstack/react-query";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { LocaleToggle } from "../../src/components/shared/LocaleToggle";
import { colors, elevation } from "../../src/theme";
import mockApi from "../../src/mocks";

export default function ProfileScreen() {
  const intl = useIntl();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: mockApi.getUser,
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "nav.profile", defaultMessage: "Profile" })}
          subtitle="Manage your account and settings"
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading profile...</Text>
          ) : user ? (
            <>
              {/* User Info Card */}
              <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[colors.rw.blue, colors.rw.green]}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </LinearGradient>
                </View>

                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>

                <View style={styles.memberSince}>
                  <Text style={styles.memberSinceLabel}>Member since</Text>
                  <Text style={styles.memberSinceDate}>
                    {new Date(user.joinedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Settings Sections */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Language</Text>
                <View style={styles.sectionCard}>
                  <LocaleToggle />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.sectionCard}>
                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemIcon}>👤</Text>
                    <Text style={styles.menuItemText}>Edit Profile</Text>
                    <Text style={styles.menuItemArrow}>›</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemIcon}>🔒</Text>
                    <Text style={styles.menuItemText}>Security</Text>
                    <Text style={styles.menuItemArrow}>›</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemIcon}>🔔</Text>
                    <Text style={styles.menuItemText}>Notifications</Text>
                    <Text style={styles.menuItemArrow}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.sectionCard}>
                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemIcon}>❓</Text>
                    <Text style={styles.menuItemText}>Help Center</Text>
                    <Text style={styles.menuItemArrow}>›</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemIcon}>📞</Text>
                    <Text style={styles.menuItemText}>Contact Us</Text>
                    <Text style={styles.menuItemArrow}>›</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuItemIcon}>ℹ️</Text>
                    <Text style={styles.menuItemText}>About</Text>
                    <Text style={styles.menuItemArrow}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Log Out</Text>
              </TouchableOpacity>

              <Text style={styles.version}>Version 1.0.0</Text>
            </>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: colors.ink[800],
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.ink[700],
    ...elevation[2],
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    ...elevation[3],
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.neutral[50],
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.neutral[300],
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: colors.neutral[400],
    marginBottom: 16,
  },
  memberSince: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ink[700],
  },
  memberSinceLabel: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  memberSinceDate: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.warm[500],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[300],
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.ink[800],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[100],
  },
  menuItemArrow: {
    fontSize: 24,
    color: colors.neutral[500],
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.ink[700],
    marginVertical: 8,
  },
  logoutButton: {
    backgroundColor: colors.warm[700],
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    ...elevation[2],
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  version: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: "center",
    marginTop: 24,
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: "center",
    marginVertical: 20,
  },
});
