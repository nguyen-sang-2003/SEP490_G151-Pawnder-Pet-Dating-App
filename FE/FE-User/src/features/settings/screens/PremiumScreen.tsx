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
  free: string;
  premium: string;
}

const features: Feature[] = [
  {
    icon: "heart",
    title: "Daily Matches",
    free: "15/day",
    premium: "Unlimited",
  },
  {
    icon: "chatbubbles",
    title: "AI Chat & Confirm",
    free: "3/day",
    premium: "Unlimited",
  },
  {
    icon: "eye",
    title: "See Who Liked You",
    free: "No",
    premium: "Yes",
  },
  {
    icon: "filter",
    title: "Advanced Filters",
    free: "No",
    premium: "Yes",
  },
  {
    icon: "shield-checkmark",
    title: "Verified Badge",
    free: "No",
    premium: "Yes",
  },
  {
    icon: "paw",
    title: "Browse Pets",
    free: "Yes",
    premium: "Yes",
  },
  {
    icon: "notifications",
    title: "Get Notifications",
    free: "Yes",
    premium: "Yes",
  },
];

const pricingPlans = [
  {
    id: "1month",
    duration: "1 Month",
    price: "125,000₫",
    pricePerMonth: "125,000₫/month",
    savings: null,
    popular: false,
  },
  {
    id: "3months",
    duration: "3 Months",
    price: "315,000₫",
    pricePerMonth: "105,000₫/month",
    savings: "Save 16%",
    popular: true,
  },
  {
    id: "6months",
    duration: "6 Months",
    price: "540,000₫",
    pricePerMonth: "90,000₫/month",
    savings: "Save 28%",
    popular: false,
  },
  {
    id: "12months",
    duration: "12 Months",
    price: "960,000₫",
    pricePerMonth: "80,000₫/month",
    savings: "Save 36%",
    popular: false,
  },
];

const PremiumScreen = ({ navigation }: Props) => {
  const [selectedPlan, setSelectedPlan] = useState("3months");

  const handleSubscribe = () => {
    const plan = pricingPlans.find((p) => p.id === selectedPlan);
    if (!plan) return;
    
    console.log("Subscribe to:", plan);
    
    // Parse amount from price string (e.g., "125,000₫" -> 125000)
    const amount = parseInt(plan.price.replace(/[,₫]/g, ""));
    
    // Navigate to QR payment screen with plan details
    navigation.navigate("QRPayment", {
      planId: plan.id,
      planName: `Pawnder Premium - ${plan.duration}`,
      amount: amount,
      duration: plan.duration,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
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
          <LinearGradient
            colors={["#FFD700", "#FFA500", "#FF8C00"]}
            style={styles.crownIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="diamond" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Pawnder Premium</Text>
          <Text style={styles.headerSubtitle}>
            Unlock unlimited possibilities for your pets
          </Text>
          <View style={styles.priceTag}>
            <Text style={styles.priceAmount}>125,000₫</Text>
            <Text style={styles.priceMonth}>/month</Text>
          </View>
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
                colors={["#667eea", "#764ba2"]}
                style={styles.benefitGradient}
              >
                <View style={styles.benefitIconCircle}>
                  <Icon name="heart" size={28} color="#667eea" />
                </View>
                <Text style={styles.benefitTitle}>Unlimited Matches</Text>
                <Text style={styles.benefitDesc}>Send unlimited likes daily</Text>
              </LinearGradient>
            </View>

            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#f093fb", "#f5576c"]}
                style={styles.benefitGradient}
              >
                <View style={styles.benefitIconCircle}>
                  <Icon name="chatbubbles" size={28} color="#f093fb" />
                </View>
                <Text style={styles.benefitTitle}>Unlimited AI</Text>
                <Text style={styles.benefitDesc}>Ask AI anytime you want</Text>
              </LinearGradient>
            </View>

            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#4facfe", "#00f2fe"]}
                style={styles.benefitGradient}
              >
                <View style={styles.benefitIconCircle}>
                  <Icon name="eye" size={28} color="#4facfe" />
                </View>
                <Text style={styles.benefitTitle}>See Who Likes</Text>
                <Text style={styles.benefitDesc}>View who liked you first</Text>
              </LinearGradient>
            </View>

            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#fa709a", "#fee140"]}
                style={styles.benefitGradient}
              >
                <View style={styles.benefitIconCircle}>
                  <Icon name="shield-checkmark" size={28} color="#fa709a" />
                </View>
                <Text style={styles.benefitTitle}>Verified Badge</Text>
                <Text style={styles.benefitDesc}>Stand out with verified</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Feature Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#667eea15" }]}>
              <Icon name="heart" size={28} color="#667eea" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>Unlimited Matches</Text>
              <Text style={styles.featureDetailDesc}>
                Send unlimited match requests daily instead of just 15
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#f093fb15" }]}>
              <Icon name="chatbubbles" size={28} color="#f093fb" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>Unlimited AI Assistance</Text>
              <Text style={styles.featureDetailDesc}>
                Get unlimited AI chat and expert confirmations daily instead of just 3
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#4facfe15" }]}>
              <Icon name="eye" size={28} color="#4facfe" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>See Who Liked You</Text>
              <Text style={styles.featureDetailDesc}>
                View all pets that liked your profile before matching
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#fa709a15" }]}>
              <Icon name="shield-checkmark" size={28} color="#fa709a" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>Verified Badge</Text>
              <Text style={styles.featureDetailDesc}>
                Get a verified badge to show your profile is authentic
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
                  colors={["#667eea", "#764ba2"]}
                  style={styles.premiumHeaderGradient}
                >
                  <Icon name="diamond" size={16} color="#fff" />
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
                  <Text style={[
                    styles.planValueText,
                    feature.free === "No" && styles.planValueDisabled
                  ]}>
                    {feature.free}
                  </Text>
                </View>
                <View style={styles.planColumn}>
                  <Text style={[
                    styles.planValueText,
                    styles.planValuePremium
                  ]}>
                    {feature.premium}
                  </Text>
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
                    colors={["#667eea", "#764ba2"]}
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
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.subscribeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="diamond" size={24} color="#fff" />
              <Text style={styles.subscribeText}>Get Premium Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Cancel anytime • Secure payment • Instant activation
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
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  headerContent: {
    alignItems: "center",
    marginTop: 30,
  },
  crownIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...shadows.large,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
  },
  priceMonth: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 4,
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
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.large,
  },
  benefitGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  benefitIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    ...shadows.medium,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  benefitDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 16,
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
  planValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
  },
  planValueDisabled: {
    color: colors.textMedium,
    opacity: 0.5,
  },
  planValuePremium: {
    color: "#667eea",
    fontWeight: "bold",
  },

  // Pricing
  pricingCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "transparent",
    position: "relative",
    ...shadows.medium,
  },
  pricingCardSelected: {
    borderColor: "#667eea",
    backgroundColor: "#f8f7ff",
    ...shadows.large,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: 20,
    borderRadius: radius.md,
    overflow: "hidden",
    ...shadows.medium,
  },
  popularGradient: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  popularText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#667eea",
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
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.large,
    elevation: 8,
  },
  subscribeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
  },
  subscribeText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 13,
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20,
    fontWeight: "500",
  },
});

export default PremiumScreen;

