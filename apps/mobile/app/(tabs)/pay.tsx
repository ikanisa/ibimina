/**
 * Pay screen - Make payments and contributions
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { LocaleToggle } from "../../src/components/shared/LocaleToggle";
import { colors, elevation } from "../../src/theme";
import {
  useReferenceTokens,
  useAllocations,
} from "../../src/features/allocations/hooks/useAllocations";
import { useGroups } from "../../src/features/groups/hooks/useGroups";
import { useAppStore } from "../../src/providers/store";

const USSD_CODE = "*182*8*1#";

export default function PayScreen() {
  const intl = useIntl();
  const featureFlags = useAppStore((state) => state.featureFlags);
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const { data: referenceTokens, isLoading: tokensLoading } = useReferenceTokens();
  const tokenValues = useMemo(
    () => referenceTokens?.map((token) => token.token).filter(Boolean) ?? [],
    [referenceTokens]
  );

  const allocationsQuery = useAllocations(tokenValues);
  const latestAllocation = allocationsQuery.data?.[0];

  const groupsQuery = useGroups({ limit: 20 });
  const joinedGroups = useMemo(
    () => groupsQuery.data?.pages.flat() ?? [],
    [groupsQuery.data]
  );

  useEffect(() => {
    if (!selectedToken && referenceTokens?.length) {
      setSelectedToken(referenceTokens[0].token);
    }
  }, [referenceTokens, selectedToken]);

  const handleCopy = useCallback(async (token: string) => {
    await Clipboard.setStringAsync(token);
    setSelectedToken(token);
    setConfirmation(
      intl.formatMessage({
        id: "pay.token.copied",
        defaultMessage: "Reference copied. Dial the USSD code to finish.",
      })
    );
  }, [intl]);

  const handleDialUssd = useCallback(() => {
    if (!selectedToken) {
      return;
    }
    setConfirmation(null);
    const encoded = encodeURIComponent(USSD_CODE);
    Linking.openURL(`tel:${encoded}`).catch(() => {
      setConfirmation(
        intl.formatMessage({
          id: "pay.ussd.error",
          defaultMessage: "Unable to open the dialer. Please dial *182*8*1# manually.",
        })
      );
    });
  }, [selectedToken, intl]);

  const copyFirstEnabled = featureFlags["ussd_copy_first"] !== false;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "nav.pay", defaultMessage: "Pay" })}
          subtitle={intl.formatMessage({
            id: "pay.subtitle",
            defaultMessage: "Copy your reference and launch the USSD flow",
          })}
          rightElement={<LocaleToggle />}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>
              {intl.formatMessage({ id: "pay.referenceTokens", defaultMessage: "Your reference tokens" })}
            </Text>
            {tokensLoading ? (
              <Text style={styles.loadingText}>Loading tokens…</Text>
            ) : referenceTokens?.length ? (
              referenceTokens.map((token) => (
                <TouchableOpacity
                  key={token.token}
                  style={[
                    styles.tokenRow,
                    selectedToken === token.token && styles.tokenRowSelected,
                  ]}
                  onPress={() => handleCopy(token.token)}
                >
                  <View style={styles.tokenInfo}>
                    <Text style={styles.tokenGroup}>{token.groupName}</Text>
                    <Text style={styles.tokenValue}>{token.token}</Text>
                  </View>
                  <Text style={styles.copyAction}>
                    {selectedToken === token.token
                      ? intl.formatMessage({ id: "pay.copied", defaultMessage: "Copied" })
                      : intl.formatMessage({ id: "pay.copy", defaultMessage: "Copy" })}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.loadingText}>
                {intl.formatMessage({
                  id: "pay.noTokens",
                  defaultMessage: "We couldn’t find any reference tokens yet.",
                })}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              {intl.formatMessage({ id: "pay.amount", defaultMessage: "Amount (RWF)" })}
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder={intl.formatMessage({
                id: "pay.amount.placeholder",
                defaultMessage: "Enter amount",
              })}
              placeholderTextColor={colors.neutral[500]}
              keyboardType="numeric"
            />
            {latestAllocation ? (
              <Text style={styles.helperText}>
                {intl.formatMessage(
                  {
                    id: "pay.lastPayment",
                    defaultMessage: "Last payment: {amount} on {date}",
                  },
                  {
                    amount: new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: latestAllocation.currency,
                      maximumFractionDigits: 0,
                    }).format(latestAllocation.amount),
                    date: new Date(latestAllocation.createdAt).toLocaleDateString(),
                  }
                )}
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              {intl.formatMessage({ id: "pay.instructions", defaultMessage: "How it works" })}
            </Text>
            <View style={styles.step}>
              <Text style={styles.stepIndex}>1</Text>
              <Text style={styles.stepCopy}>
                {copyFirstEnabled
                  ? intl.formatMessage({
                      id: "pay.step.copyFirst",
                      defaultMessage: "Tap your reference to copy it to the clipboard.",
                    })
                  : intl.formatMessage({
                      id: "pay.step.remember",
                      defaultMessage: "Remember your reference token before dialing.",
                    })}
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepIndex}>2</Text>
              <Text style={styles.stepCopy}>
                {intl.formatMessage({
                  id: "pay.step.dial",
                  defaultMessage: "Dial {code} and follow the prompts to complete your contribution.",
                }, { code: USSD_CODE })}
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepIndex}>3</Text>
              <Text style={styles.stepCopy}>
                {intl.formatMessage({
                  id: "pay.step.confirm",
                  defaultMessage: "Return here to see the allocation once it is reconciled.",
                })}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.payButton, (!selectedToken || !tokenValues.length) && styles.payButtonDisabled]}
            onPress={handleDialUssd}
            disabled={!selectedToken || !tokenValues.length}
          >
            <LinearGradient
              colors={[colors.rw.blue, colors.rw.green]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              <Text style={styles.payButtonText}>
                {intl.formatMessage({ id: "pay.launchUssd", defaultMessage: "Start *182*8*1#" })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {confirmation ? <Text style={styles.confirmation}>{confirmation}</Text> : null}

          <View style={styles.card}>
            <Text style={styles.label}>
              {intl.formatMessage({ id: "pay.linkedGroups", defaultMessage: "Linked groups" })}
            </Text>
            {groupsQuery.isLoading ? (
              <Text style={styles.loadingText}>Loading groups…</Text>
            ) : joinedGroups.length ? (
              joinedGroups.map((group) => (
                <View key={group.id} style={styles.groupRow}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMeta}>
                    {intl.formatMessage({
                      id: "pay.group.members",
                      defaultMessage: "{count} members",
                    }, { count: group.memberCount })}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.loadingText}>
                {intl.formatMessage({
                  id: "pay.groups.empty",
                  defaultMessage: "You are not linked to any groups yet.",
                })}
              </Text>
            )}
          </View>

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
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[200],
  },
  tokenRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ink[700],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tokenRowSelected: {
    borderColor: colors.rw.blue,
    backgroundColor: "rgba(98,140,255,0.12)",
  },
  tokenInfo: {
    flex: 1,
    gap: 4,
  },
  tokenGroup: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[50],
  },
  tokenValue: {
    fontSize: 13,
    color: colors.neutral[300],
  },
  copyAction: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.rw.blue,
  },
  input: {
    backgroundColor: colors.ink[900],
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.ink[700],
  },
  helperText: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    textAlign: "center",
    lineHeight: 24,
    color: colors.neutral[100],
    fontWeight: "700",
  },
  stepCopy: {
    flex: 1,
    color: colors.neutral[300],
    fontSize: 14,
  },
  payButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: "hidden",
    ...elevation[3],
  },
  payButtonDisabled: {
    opacity: 0.4,
  },
  payButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  confirmation: {
    marginTop: 12,
    textAlign: "center",
    color: colors.neutral[200],
  },
  groupRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[700],
  },
  groupName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[50],
  },
  groupMeta: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[400],
  },
});
