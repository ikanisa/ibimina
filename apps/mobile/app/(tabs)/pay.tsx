/**
 * Pay screen - Make payments and contributions
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { LocaleToggle } from "../../src/components/shared/LocaleToggle";
import { colors, elevation } from "../../src/theme";
import mockApi from "../../src/mocks";

export default function PayScreen() {
  const intl = useIntl();
  const [amount, setAmount] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: mockApi.getGroups,
  });

  const handlePayment = () => {
    if (selectedGroup && amount) {
      mockApi.makePayment(Number(amount), selectedGroup);
      // Show success message
      console.log(`Payment of ${amount} to group ${selectedGroup}`);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "nav.pay", defaultMessage: "Pay" })}
          subtitle="Make your monthly contribution"
          rightElement={<LocaleToggle />}
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>Select Group</Text>
            {groups
              ?.filter((g) => g.joined)
              .map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupOption,
                    selectedGroup === group.id && styles.groupOptionSelected,
                  ]}
                  onPress={() => setSelectedGroup(group.id)}
                >
                  <Text
                    style={[
                      styles.groupName,
                      selectedGroup === group.id && styles.groupNameSelected,
                    ]}
                  >
                    {group.name}
                  </Text>
                  <Text style={styles.groupInfo}>
                    Balance: {(group.totalSavings / 1000).toFixed(0)}K {group.currency}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Amount (RWF)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity style={styles.paymentMethod}>
                <Text style={styles.paymentMethodText}>💳 Mobile Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentMethod}>
                <Text style={styles.paymentMethodText}>🏦 Bank Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.payButton, (!selectedGroup || !amount) && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={!selectedGroup || !amount}
          >
            <LinearGradient
              colors={[colors.rw.blue, colors.rw.green]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              <Text style={styles.payButtonText}>
                {intl.formatMessage({ id: "button.pay", defaultMessage: "Pay" })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

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
  },
  card: {
    backgroundColor: colors.ink[800],
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.ink[700],
    ...elevation[2],
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[200],
    marginBottom: 12,
  },
  groupOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ink[700],
    marginBottom: 8,
  },
  groupOptionSelected: {
    borderColor: colors.rw.blue,
    backgroundColor: `${colors.rw.blue}20`,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[100],
    marginBottom: 4,
  },
  groupNameSelected: {
    color: colors.rw.blue,
  },
  groupInfo: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  input: {
    backgroundColor: colors.ink[900],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  paymentMethods: {
    gap: 8,
  },
  paymentMethod: {
    backgroundColor: colors.ink[900],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.neutral[200],
  },
  payButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: "hidden",
    ...elevation[3],
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
