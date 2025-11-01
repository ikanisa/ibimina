/**
 * Offers screen - View available offers and promotions
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIntl } from "react-intl";
import { useQuery } from "@tanstack/react-query";
import { HeaderGradient } from "../../src/components/shared/HeaderGradient";
import { colors, elevation, glassmorphism } from "../../src/theme";
import mockApi from "../../src/mocks";

export default function OffersScreen() {
  const intl = useIntl();
  
  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: mockApi.getOffers,
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.ink[900], colors.ink[800]]} style={styles.gradient}>
        <HeaderGradient
          title={intl.formatMessage({ id: "nav.offers", defaultMessage: "Offers" })}
          subtitle="Special deals and promotions"
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading offers...</Text>
          ) : offers && offers.length > 0 ? (
            offers.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.imageContainer}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imageEmoji}>
                      {offer.type === "loan" ? "💰" : offer.type === "bonus" ? "🎁" : "⭐"}
                    </Text>
                  </View>
                  <View style={[styles.typeBadge, glassmorphism.light]}>
                    <Text style={styles.typeBadgeText}>{offer.type.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.offerContent}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerDescription}>{offer.description}</Text>
                  
                  <View style={styles.offerFooter}>
                    <View style={styles.validityContainer}>
                      <Text style={styles.validityLabel}>Valid until:</Text>
                      <Text style={styles.validityDate}>
                        {new Date(offer.validUntil).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <TouchableOpacity style={styles.detailsButton}>
                      <LinearGradient
                        colors={[colors.rw.blue, colors.rw.green]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.detailsButtonGradient}
                      >
                        <Text style={styles.detailsButtonText}>View Details</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🎁</Text>
              <Text style={styles.emptyStateTitle}>No offers available</Text>
              <Text style={styles.emptyStateText}>
                Check back later for special deals and promotions
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
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[50],
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    color: colors.neutral[300],
    lineHeight: 20,
    marginBottom: 16,
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
  detailsButton: {
    borderRadius: 8,
    overflow: "hidden",
    ...elevation[2],
  },
  detailsButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
    color: colors.neutral[200],
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: "center",
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[400],
    textAlign: "center",
    marginVertical: 20,
  },
});
