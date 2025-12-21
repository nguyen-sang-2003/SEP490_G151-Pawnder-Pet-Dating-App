import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { useTranslation } from "react-i18next";
import { getVipStatus, VipStatusResponse } from "../api/paymentApi";
import { getItem } from "../../../services/storage";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "Premium">;

interface Feature {
  icon: string;
  titleKey: string;
  free: string;
  premium: string;
}

const getFeatures = (t: any): Feature[] => [
  {
    icon: "heart",
    titleKey: "payment.premium.features.matchRequests",
    free: t("payment.premium.features.comparison.matchFree"),
    premium: t("payment.premium.features.comparison.matchPremium"),
  },
  {
    icon: "chatbubbles",
    titleKey: "payment.premium.features.expertChat",
    free: t("payment.premium.features.comparison.expertChatFree"),
    premium: t("payment.premium.features.comparison.expertChatPremium"),
  },
  {
    icon: "checkmark-done",
    titleKey: "payment.premium.features.expertConfirmation",
    free: t("payment.premium.features.comparison.expertConfirmFree"),
    premium: t("payment.premium.features.comparison.expertConfirmPremium"),
  },
  {
    icon: "sparkles",
    titleKey: "payment.premium.features.aiTokens",
    free: t("payment.premium.features.comparison.aiTokensFree"),
    premium: t("payment.premium.features.comparison.aiTokensPremium"),
  },
  {
    icon: "shield-checkmark",
    titleKey: "payment.premium.features.premiumBadge",
    free: t("payment.premium.features.no"),
    premium: t("payment.premium.features.yes"),
  },
];

const getPricingPlans = (t: any) => [
  {
    id: "1month",
    duration: t("payment.premium.plans.month1"),
    price: "99,000₫",
    pricePerMonth: `99,000₫${t("payment.premium.plans.perMonth")}`,
    savings: null,
    popular: true,
  },
];

const PremiumScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState("1month");
  const [vipStatus, setVipStatus] = useState<VipStatusResponse | null>(null);
  const [loadingVip, setLoadingVip] = useState(true);
  
  const features = getFeatures(t);
  const pricingPlans = getPricingPlans(t);

  // Load VIP status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadVipStatus();
    }, [])
  );

  const loadVipStatus = async () => {
    try {
      setLoadingVip(true);
      const userIdStr = await getItem('userId');
      if (userIdStr) {
        const userId = parseInt(userIdStr);
        const status = await getVipStatus(userId);
        setVipStatus(status);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingVip(false);
    }
  };

  const handleSubscribe = () => {
    const plan = pricingPlans.find((p) => p.id === selectedPlan);
    if (!plan) return;
    
    // Parse amount from price string
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
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
            <Text style={styles.headerTitle}>{t("payment.premium.title")}</Text>
            <Text style={styles.headerSubtitle}>
              {t("payment.premium.subtitle")}
            </Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceAmount}>{t("payment.premium.price")}</Text>
              <Text style={styles.priceMonth}>{t("payment.premium.pricePerMonth")}</Text>
            </View>
          </View>
        </LinearGradient>
        {/* Premium Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("payment.premium.sectionFeatures")}</Text>

          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.benefitGradient}
              >
                <View style={styles.benefitIconCircle}>
                  <Icon name="heart" size={28} color="#667eea" />
                </View>
                <Text style={styles.benefitTitle}>{t("payment.premium.benefits.matchTitle")}</Text>
                <Text style={styles.benefitDesc}>{t("payment.premium.benefits.matchDesc")}</Text>
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
                <Text style={styles.benefitTitle}>{t("payment.premium.benefits.expertChatTitle")}</Text>
                <Text style={styles.benefitDesc}>{t("payment.premium.benefits.expertChatDesc")}</Text>
              </LinearGradient>
            </View>

            <View style={styles.benefitCard}>
              <LinearGradient
                colors={["#4facfe", "#00f2fe"]}
                style={styles.benefitGradient}
              >
                <View style={styles.benefitIconCircle}>
                  <Icon name="sparkles" size={28} color="#4facfe" />
                </View>
                <Text style={styles.benefitTitle}>{t("payment.premium.benefits.aiTokensTitle")}</Text>
                <Text style={styles.benefitDesc}>{t("payment.premium.benefits.aiTokensDesc")}</Text>
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
                <Text style={styles.benefitTitle}>{t("payment.premium.benefits.badgeTitle")}</Text>
                <Text style={styles.benefitDesc}>{t("payment.premium.benefits.badgeDesc")}</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Feature Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("payment.premium.sectionBenefits")}</Text>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#667eea15" }]}>
              <Icon name="heart" size={28} color="#667eea" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>{t("payment.premium.details.matchTitle")}</Text>
              <Text style={styles.featureDetailDesc}>
                {t("payment.premium.details.matchDesc")}
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#f093fb15" }]}>
              <Icon name="chatbubbles" size={28} color="#f093fb" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>{t("payment.premium.details.expertChatTitle")}</Text>
              <Text style={styles.featureDetailDesc}>
                {t("payment.premium.details.expertChatDesc")}
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#4facfe15" }]}>
              <Icon name="checkmark-done" size={28} color="#4facfe" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>{t("payment.premium.details.expertConfirmTitle")}</Text>
              <Text style={styles.featureDetailDesc}>
                {t("payment.premium.details.expertConfirmDesc")}
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#fa709a15" }]}>
              <Icon name="sparkles" size={28} color="#fa709a" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>{t("payment.premium.details.aiTokensTitle")}</Text>
              <Text style={styles.featureDetailDesc}>
                {t("payment.premium.details.aiTokensDesc")}
              </Text>
            </View>
          </View>

          <View style={styles.featureDetailCard}>
            <View style={[styles.featureDetailIcon, { backgroundColor: "#667eea15" }]}>
              <Icon name="shield-checkmark" size={28} color="#667eea" />
            </View>
            <View style={styles.featureDetailContent}>
              <Text style={styles.featureDetailTitle}>{t("payment.premium.details.badgeTitle")}</Text>
              <Text style={styles.featureDetailDesc}>
                {t("payment.premium.details.badgeDesc")}
              </Text>
            </View>
          </View>
        </View>

        {/* Feature Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("payment.premium.sectionComparison")}</Text>

          <View style={styles.comparisonTable}>
            <View style={styles.tableHeader}>
              <View style={styles.featureColumn}>
                <Text style={styles.tableHeaderText}>{t("payment.premium.comparison.feature")}</Text>
              </View>
              <View style={styles.planColumn}>
                <Text style={styles.tableHeaderText}>{t("payment.premium.comparison.free")}</Text>
              </View>
              <View style={styles.planColumn}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.premiumHeaderGradient}
                >
                  <Icon name="diamond" size={16} color="#fff" />
                  <Text style={styles.premiumHeaderText}>{t("payment.premium.comparison.premium")}</Text>
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
                  <Text style={styles.featureText}>{t(feature.titleKey)}</Text>
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

        {/* VIP Status Card - Show when user is VIP */}
        {vipStatus?.isVip && vipStatus.subscription && (
          <View style={styles.section}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vipActiveCard}
            >
              <View style={styles.vipActiveIconContainer}>
                <Icon name="diamond" size={32} color="#FFF" />
              </View>
              <View style={styles.vipActiveInfo}>
                <View style={styles.vipActiveTitleRow}>
                  <Text style={styles.vipActiveTitle}>{t("payment.premium.vipActive.title")}</Text>
                  <View style={styles.vipActiveBadge}>
                    <Icon name="checkmark-circle" size={12} color="#FFF" />
                    <Text style={styles.vipActiveBadgeText}>{t("payment.premium.vipActive.active")}</Text>
                  </View>
                </View>
                <Text style={styles.vipActiveExpiry}>
                  {t("payment.premium.vipActive.expireDate", {
                    date: new Date(vipStatus.subscription.endDate).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }),
                    days: vipStatus.subscription.daysRemaining
                  })}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Pricing Plans - Only show when user is NOT VIP */}
        {!vipStatus?.isVip && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("payment.premium.sectionChoosePlan")}</Text>

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
                      <Text style={styles.popularText}>{t("payment.premium.plans.mostPopular")}</Text>
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
        )}

        {/* Subscribe Button - Only show when user is NOT VIP */}
        <View style={styles.section}>
          {loadingVip ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : vipStatus?.isVip ? (
            // Show "Already VIP" message
            <View style={styles.alreadyVipContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.alreadyVipGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.alreadyVipText}>{t("payment.premium.alreadyVip")}</Text>
              </LinearGradient>
              <Text style={styles.alreadyVipHint}>
                {t("payment.premium.alreadyVipHint")}
              </Text>
            </View>
          ) : (
            // Show Subscribe button
            <>
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
                  <Text style={styles.subscribeText}>{t("payment.premium.subscribeButton")}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                {t("payment.premium.disclaimer")}
              </Text>
            </>
          )}
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

  // VIP Active Card
  vipActiveCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: radius.xl,
    ...shadows.large,
  },
  vipActiveIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vipActiveInfo: {
    flex: 1,
  },
  vipActiveTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
  },
  vipActiveTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  vipActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  vipActiveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  vipActiveExpiry: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },

  // Already VIP
  alreadyVipContainer: {
    alignItems: "center",
  },
  alreadyVipGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: radius.xl,
    ...shadows.large,
  },
  alreadyVipText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  alreadyVipHint: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20,
  },
});

export default PremiumScreen;

