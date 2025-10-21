import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "Premium">;

interface Feature {
  icon: string;
  title: string;
  free: boolean;
  premium: boolean;
}

const features: Feature[] = [
  {
    icon: "heart",
    title: "Unlimited Likes",
    free: false,
    premium: true,
  },
  {
    icon: "eye",
    title: "See Who Liked You",
    free: false,
    premium: true,
  },
  {
    icon: "filter",
    title: "Advanced Filters",
    free: false,
    premium: true,
  },
  {
    icon: "ban",
    title: "No Ads",
    free: false,
    premium: true,
  },
  {
    icon: "shield-checkmark",
    title: "Verified Badge",
    free: false,
    premium: true,
  },
  {
    icon: "paw",
    title: "Browse Cats",
    free: true,
    premium: true,
  },
  {
    icon: "chatbubbles",
    title: "Chat with Matches",
    free: true,
    premium: true,
  },
  {
    icon: "notifications",
    title: "Get Notifications",
    free: true,
    premium: true,
  },
];

const pricingPlans = [
  {
    id: "1month",
    duration: "1 Month",
    price: "99,000₫",
    pricePerMonth: "99,000₫/month",
    savings: null,
    popular: false,
  },
  {
    id: "3months",
    duration: "3 Months",
    price: "249,000₫",
    pricePerMonth: "83,000₫/month",
    savings: "Save 16%",
    popular: true,
  },
  {
    id: "6months",
    duration: "6 Months",
    price: "399,000₫",
    pricePerMonth: "66,500₫/month",
    savings: "Save 33%",
    popular: false,
  },
];

const PremiumScreen = ({ navigation }: Props) => {
  const [selectedPlan, setSelectedPlan] = useState("3months");

  const handleSubscribe = () => {
    const plan = pricingPlans.find((p) => p.id === selectedPlan);
    console.log("Subscribe to:", plan);
    // Navigate to payment screen
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FFD700", "#FFA500", "#FF6EA7"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.crownIcon}>
            <Icon name="star" size={60} color="#FFD700" />
          </View>
          <Text style={styles.headerTitle}>Go Premium</Text>
          <Text style={styles.headerSubtitle}>
            Find the perfect match for your cat faster
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>

          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#FF6EA7", "#FF9BC0"]}
                style={styles.benefitGradient}
              >
                <Icon name="heart" size={32} color="#fff" />
                <Text style={styles.benefitTitle}>Unlimited</Text>
                <Text style={styles.benefitDesc}>Likes</Text>
              </LinearGradient>
            </View>

            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#9C27B0", "#BA68C8"]}
                style={styles.benefitGradient}
              >
                <Icon name="eye" size={32} color="#fff" />
                <Text style={styles.benefitTitle}>See Who</Text>
                <Text style={styles.benefitDesc}>Liked You</Text>
              </LinearGradient>
            </View>

            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#FF9800", "#FFB74D"]}
                style={styles.benefitGradient}
              >
                <Icon name="filter" size={32} color="#fff" />
                <Text style={styles.benefitTitle}>Advanced</Text>
                <Text style={styles.benefitDesc}>Filters</Text>
              </LinearGradient>
            </View>

            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#2196F3", "#64B5F6"]}
                style={styles.benefitGradient}
              >
                <Icon name="shield-checkmark" size={32} color="#fff" />
                <Text style={styles.benefitTitle}>Verified</Text>
                <Text style={styles.benefitDesc}>Badge</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Feature Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>

          <View style={styles.featureDetailCard}>
            <View style={styles.featureDetailIcon}>
              <Icon name="heart" size={28} color="#FF6EA7" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>Unlimited Likes</Text>
              <Text style={styles.featureDetailDesc}>
                Like as many cats as you want without daily limits
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={styles.featureDetailIcon}>
              <Icon name="eye" size={28} color="#9C27B0" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>See Who Liked You</Text>
              <Text style={styles.featureDetailDesc}>
                View all cats that liked your profile before matching
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={styles.featureDetailIcon}>
              <Icon name="filter" size={28} color="#FF9800" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>Advanced Filters</Text>
              <Text style={styles.featureDetailDesc}>
                Filter by breed, age, characteristics and preferences
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={styles.featureDetailIcon}>
              <Icon name="shield-checkmark" size={28} color="#2196F3" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>Verified Badge</Text>
              <Text style={styles.featureDetailDesc}>
                Get a verified badge to show your profile is authentic
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={styles.featureDetailIcon}>
              <Icon name="ban" size={28} color="#E91E63" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>Ad-Free Experience</Text>
              <Text style={styles.featureDetailDesc}>
                Enjoy Pawnder without any advertisements
              </Text>
            </View>
          </View>
        </View>

        {/* Feature Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free vs Premium</Text>

          <View style={styles.comparisonTable}>
            <View style={styles.tableHeader}>
              <View style={styles.featureColumn}>
                <Text style={styles.tableHeaderText}>Features</Text>
              </View>
              <View style={styles.planColumn}>
                <Text style={styles.tableHeaderText}>Free</Text>
              </View>
              <View style={styles.planColumn}>
                <LinearGradient
                  colors={["#FFD700", "#FFA500"]}
                  style={styles.premiumHeaderGradient}
                >
                  <Icon name="star" size={16} color="#fff" />
                  <Text style={styles.premiumHeaderText}>Premium</Text>
                </LinearGradient>
              </View>
            </View>

            {features.map((feature, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.featureColumn}>
                  <Icon
                    name={feature.icon}
                    size={18}
                    color={colors.textDark}
                  />
                  <Text style={styles.featureText}>{feature.title}</Text>
                </View>
                <View style={styles.planColumn}>
                  <Icon
                    name={feature.free ? "checkmark-circle" : "close-circle"}
                    size={24}
                    color={feature.free ? colors.success : "#E0E0E0"}
                  />
                </View>
                <View style={styles.planColumn}>
                  <Icon
                    name={
                      feature.premium ? "checkmark-circle" : "close-circle"
                    }
                    size={24}
                    color={feature.premium ? "#FFD700" : "#E0E0E0"}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

          {pricingPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.pricingCard,
                selectedPlan === plan.id && styles.pricingCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <LinearGradient
                    colors={["#FFD700", "#FFA500"]}
                    style={styles.popularGradient}
                  >
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </LinearGradient>
                </View>
              )}

              <View style={styles.pricingContent}>
                <View style={styles.pricingLeft}>
                  <View style={styles.radioButton}>
                    {selectedPlan === plan.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.pricingInfo}>
                    <Text style={styles.pricingDuration}>
                      {plan.duration}
                    </Text>
                    <Text style={styles.pricingPerMonth}>
                      {plan.pricePerMonth}
                    </Text>
                    {plan.savings && (
                      <Text style={styles.pricingSavings}>
                        {plan.savings}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.pricingTotal}>{plan.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscribe Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF6EA7"]}
              style={styles.subscribeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="star" size={24} color="#fff" />
              <Text style={styles.subscribeText}>Subscribe Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Gói đăng ký tự động gia hạn trừ khi bạn hủy.{"\n"}
            Có thể hủy bất cứ lúc nào.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  headerContent: {
    alignItems: "center",
    marginTop: 20,
  },
  crownIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },

  // Content
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 16,
  },

  // Benefits Grid
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  benefitCard: {
    width: (width - 52) / 2,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  benefitGradient: {
    padding: 20,
    alignItems: "center",
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  benefitDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },

  // Feature Detail Cards
  featureDetailCard: {
    flexDirection: "row",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  featureDetailIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureDetailContent: {
    flex: 1,
    justifyContent: "center",
  },
  featureDetailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 4,
  },
  featureDetailDesc: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },

  // Comparison Table
  comparisonTable: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.small,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textDark,
  },
  premiumHeaderGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  premiumHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  featureColumn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.textDark,
    flex: 1,
  },
  planColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Pricing
  pricingCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    ...shadows.small,
  },
  pricingCardSelected: {
    borderColor: "#FFD700",
    ...shadows.large,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: 20,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  popularGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  pricingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pricingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFD700",
  },
  pricingInfo: {},
  pricingDuration: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 4,
  },
  pricingPerMonth: {
    fontSize: 14,
    color: colors.textMedium,
  },
  pricingSavings: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
    marginTop: 2,
  },
  pricingTotal: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // Subscribe
  subscribeButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.large,
  },
  subscribeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
  },
  subscribeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
});

export default PremiumScreen;

