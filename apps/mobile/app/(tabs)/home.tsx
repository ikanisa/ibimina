/**
 * Home screen - Dashboard with groups and statements overview
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import { useQuery } from "@tanstack/react-query";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { FloatingAskToJoinFab } from "../../src/components/shared/FloatingAskToJoinFab";
import { colors, elevation } from "../../src/theme";
import mockApi from "../../src/mocks";

export default function HomeScreen() {
  const intl = useIntl();
  
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: mockApi.getGroups,
  });

  const { data: statements, isLoading: statementsLoading } = useQuery({
    queryKey: ["statements"],
    queryFn: mockApi.getStatements,
  });

  const handleJoinGroup = () => {
    console.log("Join group pressed");
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "home.greeting", defaultMessage: "Hello" })}
          subtitle={intl.formatMessage({ id: "home.subtitle", defaultMessage: "Track your savings in real time" })}
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Groups Section */}
          <Text style={styles.sectionTitle}>
            {intl.formatMessage({ id: "home.groups", defaultMessage: "Your groups" })}
          </Text>
          
          {groupsLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            groups?.map((group) => (
              <View key={group.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{group.name}</Text>
                  {group.joined && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Member</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtitle}>{group.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardInfo}>
                    {group.memberCount} members • {(group.totalSavings / 1000).toFixed(0)}K {group.currency}
                  </Text>
                  {!group.joined && (
                    <TouchableOpacity style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>
                        {intl.formatMessage({ id: "button.join", defaultMessage: "Join" })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Statements Section */}
          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
            {intl.formatMessage({ id: "home.statements", defaultMessage: "Recent statements" })}
          </Text>
          
          {statementsLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            statements?.map((statement) => (
              <View key={statement.id} style={styles.statementCard}>
                <View style={styles.statementHeader}>
                  <Text style={styles.statementMonth}>{statement.month}</Text>
                  <Text style={styles.statementGroup}>{statement.groupName}</Text>
                </View>
                <View style={styles.statementRow}>
                  <Text style={styles.statementLabel}>Closing Balance</Text>
                  <Text style={styles.statementValue}>
                    {statement.closingBalance.toLocaleString()} {statement.currency}
                  </Text>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <FloatingAskToJoinFab onPress={handleJoinGroup} label="Ask to Join" />
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[100],
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleSpaced: {
    marginTop: 32,
  },
  card: {
    backgroundColor: colors.ink[800],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
    ...elevation[2],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[50],
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.neutral[300],
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  badge: {
    backgroundColor: colors.rw.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  joinButton: {
    backgroundColor: colors.rw.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statementCard: {
    backgroundColor: colors.ink[800],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  statementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statementMonth: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[100],
  },
  statementGroup: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  statementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statementLabel: {
    fontSize: 14,
    color: colors.neutral[300],
  },
  statementValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warm[500],
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: "center",
    marginVertical: 20,
  },
});
