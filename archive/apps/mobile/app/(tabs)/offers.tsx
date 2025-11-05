/**
 * Offers screen - View available offers and promotions
 */

import { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { colors, elevation, glassmorphism } from "../../src/theme";
import { useFeatureFlags } from "../../src/features/feature-flags/hooks/useFeatureFlags";

interface FeatureOffer {
  id: string;
  type: "service" | "bonus" | "beta";
  title: string;
  description: string;
  validUntil?: string | null;
}

const offerForFeature = (intl: ReturnType<typeof useIntl>, key: string): FeatureOffer | null => {
  switch (key) {
    case "ai_agent":
      return {
        id: "ai-agent",
        type: "service",
        title: intl.formatMessage({ id: "offers.ai.title", defaultMessage: "Ibimina Assist" }),
        description: intl.formatMessage({
          id: "offers.ai.description",
          defaultMessage: "Chat with the SACCO+ assistant for USSD steps and statement summaries.",
        }),
      };
    case "offers_marketplace":
      return {
        id: "marketplace",
        type: "bonus",
        title: intl.formatMessage({ id: "offers.marketplace.title", defaultMessage: "Marketplace Beta" }),
        description: intl.formatMessage({
          id: "offers.marketplace.description",
          defaultMessage: "Early access to partner discounts and seasonal contribution boosters.",
        }),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      };
    case "statements_insights":
      return {
        id: "insights",
        type: "beta",
        title: intl.formatMessage({ id: "offers.insights.title", defaultMessage: "Statements Insights" }),
        description: intl.formatMessage({
          id: "offers.insights.description",
          defaultMessage: "Unlock monthly analytics that highlight contribution trends across your groups.",
        }),
      };
    default:
      return null;
  }
};

export default function OffersScreen() {
  const intl = useIntl();
  const featureFlagsQuery = useFeatureFlags();

  const offers = useMemo(() => {
    if (!featureFlagsQuery.data) {
      return [] as FeatureOffer[];
    }
    const entries = Object.entries(featureFlagsQuery.data).filter(([, value]) => value.enabled);
    const derived = entries
      .map(([key]) => offerForFeature(intl, key))
      .filter((offer): offer is FeatureOffer => Boolean(offer));
    return derived;
  }, [featureFlagsQuery.data, intl]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "nav.offers", defaultMessage: "Offers" })}
          subtitle={intl.formatMessage({
            id: "offers.subtitle",
            defaultMessage: "Server-driven perks based on your feature access",
          })}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {featureFlagsQuery.isLoading ? (
            <Text style={styles.loadingText}>Loading offers...</Text>
          ) : offers.length > 0 ? (
            offers.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.imageContainer}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imageEmoji}>
                      {offer.type === "bonus" ? "🎁" : offer.type === "beta" ? "🧪" : "🤖"}
                    </Text>
                  </View>
                  <View style={[styles.typeBadge, glassmorphism.light]}>
                    <Text style={styles.typeBadgeText}>{offer.type.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.offerContent}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerDescription}>{offer.description}</Text>

                  {offer.validUntil ? (
                    <View style={styles.offerFooter}>
                      <View style={styles.validityContainer}>
                        <Text style={styles.validityLabel}>Valid until:</Text>
                        <Text style={styles.validityDate}>
                          {new Date(offer.validUntil).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🎁</Text>
              <Text style={styles.emptyStateTitle}>No offers available</Text>
              <Text style={styles.emptyStateText}>
                {intl.formatMessage({
                  id: "offers.empty",
                  defaultMessage: "Toggle feature flags in the dashboard to unlock pilot programmes.",
                })}
              </Text>
            </View>
          )}

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
  offerCard: {
    backgroundColor: colors.ink[800],
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.ink[700],
    ...elevation[3],
  },
  imageContainer: {
    height: 180,
    backgroundColor: colors.ink[700],
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink[700],
  },
  imageEmoji: {
    fontSize: 64,
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.neutral[900],
    letterSpacing: 0.5,
  },
  offerContent: {
    padding: 16,
    gap: 12,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[50],
  },
  offerDescription: {
    fontSize: 14,
    color: colors.neutral[300],
    lineHeight: 20,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  validityContainer: {
    flex: 1,
  },
  validityLabel: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  validityDate: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warm[500],
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[100],
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.neutral[300],
    textAlign: "center",
    marginTop: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[400],
  },
});
