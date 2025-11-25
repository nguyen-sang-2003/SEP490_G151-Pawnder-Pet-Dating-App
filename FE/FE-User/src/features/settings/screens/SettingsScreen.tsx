import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { logout } from "../../../api/auth";
import { getItem } from "../../../utils/storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { getVipStatus, VipStatusResponse } from "../../../api/payment";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

interface SettingsItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  showBadge?: boolean;
}

const SettingsScreen = ({ navigation }: Props) => {
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [vipStatus, setVipStatus] = useState<VipStatusResponse | null>(null);
  const [loadingVip, setLoadingVip] = useState(true);

  // Reload VIP status when screen comes into focus
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
      console.error('Error loading VIP status:', error);
    } finally {
      setLoadingVip(false);
    }
  };
  
  const accountSettings: SettingsItem[] = [
    {
      icon: "person-outline",
      title: "Edit Profile",
      subtitle: "Update your personal information",
      onPress: () => navigation.navigate("EditProfile", {}),
    },
    {
      icon: "paw-outline",
      title: "My Pets",
      subtitle: "Manage your pet profiles",
      onPress: () => navigation.navigate("Profile"),
    },
    {
      icon: "key-outline",
      title: "Change Password",
      subtitle: "Update your password",
      onPress: () => navigation.navigate("ChangePassword"),
    },
  ];

  const appSettings: SettingsItem[] = [
    {
      icon: "shield-checkmark-outline",
      title: "Privacy & Safety",
      subtitle: "Control your privacy settings",
      onPress: () => navigation.navigate("PrivacyAndSafety"),
    },
    {
      icon: "ban-outline",
      title: "Blocked Users",
      subtitle: "Manage blocked accounts",
      onPress: () => navigation.navigate("BlockedUsers"),
    },
    {
      icon: "flag-outline",
      title: "My Reports",
      subtitle: "View your reported content",
      onPress: () => navigation.navigate("MyReports"),
    },
    {
      icon: "notifications-outline",
      title: "Notifications",
      subtitle: "Configure notification preferences",
      onPress: () => showAlert({ type: 'info', title: "Coming Soon", message: "This feature is under development" }),
    },
  ];

  const supportSettings: SettingsItem[] = [
    {
      icon: "help-circle-outline",
      title: "Help & Support",
      subtitle: "Get help and contact support",
      onPress: () => navigation.navigate("HelpAndSupport"),
    },
    {
      icon: "document-text-outline",
      title: "Terms & Conditions",
      subtitle: "Read our terms of service",
      onPress: () => navigation.navigate("ResourceDetail", { type: "terms" }),
    },
    {
      icon: "shield-outline",
      title: "Privacy Policy",
      subtitle: "Read our privacy policy",
      onPress: () => navigation.navigate("ResourceDetail", { type: "privacy" }),
    },
  ];

  const premiumSettings: SettingsItem[] = [
    {
      icon: "diamond-outline",
      title: "Pawnder Premium",
      subtitle: "Unlock exclusive features",
      onPress: () => navigation.navigate("Premium"),
      iconColor: colors.primary,
    },
    {
      icon: "receipt-outline",
      title: "Payment History",
      subtitle: "View your transaction history",
      onPress: () => navigation.navigate("PaymentHistory"),
    },
  ];

  const handleLogout = async () => {
    try {
      // Call logout API (will invalidate tokens on server and clear local storage)
      await logout();
      console.log('🔓 Logged out successfully');
      
      // Navigate to Welcome screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Even if there's an error, navigate to Welcome since tokens are cleared locally
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    }
  };

  const dangerSettings: SettingsItem[] = [
    {
      icon: "log-out-outline",
      title: "Sign Out",
      onPress: () => {
        showAlert({
          type: 'warning',
          title: "Sign Out",
          message: "Are you sure you want to sign out?",
          showCancel: true,
          confirmText: "Sign Out",
          onConfirm: handleLogout,
        });
      },
      iconColor: colors.error,
    },
    {
      icon: "trash-outline",
      title: "Delete Account",
      onPress: () => {
        showAlert({
          type: 'error',
          title: "Delete Account",
          message: "This action cannot be undone. All your data will be permanently deleted.",
          showCancel: true,
          confirmText: "Delete",
          onConfirm: () => console.log("Delete account"),
        });
      },
      iconColor: colors.error,
    },
  ];

  const renderSettingsItem = (item: SettingsItem, index: number, isLast: boolean) => (
    <TouchableOpacity
      key={index}
      style={[styles.settingsItem, isLast && styles.settingsItemLast]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <View
          style={[
            styles.settingsIcon,
            item.iconColor ? { backgroundColor: `${item.iconColor}15` } : {},
          ]}
        >
          <Icon
            name={item.icon}
            size={22}
            color={item.iconColor || colors.primary}
          />
        </View>
        <View style={styles.settingsInfo}>
          <Text
            style={[
              styles.settingsTitle,
              item.iconColor === colors.error && { color: colors.error },
            ]}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textLabel} />
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingsItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, index) =>
          renderSettingsItem(item, index, index === items.length - 1)
        )}
      </View>
    </View>
  );

  const renderVipStatusCard = () => {
    if (loadingVip) {
      return (
        <View style={styles.vipCard}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (vipStatus?.isVip && vipStatus.subscription) {
      const { endDate, daysRemaining } = vipStatus.subscription;
      const endDateObj = new Date(endDate);
      const formattedDate = endDateObj.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      return (
        <TouchableOpacity
          style={styles.vipCardContainer}
          onPress={() => navigation.navigate("Premium")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipCardActive}
          >
            {/* Diamond Icon with glow effect */}
            <View style={styles.vipIconContainer}>
              <View style={styles.vipIconGlow} />
              <Icon name="diamond" size={32} color="#FFF" />
            </View>

            {/* VIP Info */}
            <View style={styles.vipInfo}>
              <View style={styles.vipTitleRow}>
                <Text style={styles.vipTitle}>Pawnder Premium</Text>
                <View style={styles.vipBadge}>
                  <Icon name="checkmark-circle" size={16} color="#FFF" />
                  <Text style={styles.vipBadgeText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.vipSubtitle}>
                Expires on {formattedDate} • {daysRemaining} days left
              </Text>
            </View>

            {/* Arrow */}
            <Icon name="chevron-forward" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // Free user - call to action card
    return (
      <TouchableOpacity
        style={styles.vipCardContainer}
        onPress={() => navigation.navigate("Premium")}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#F093FB', '#F5576C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.vipCardInactive}
        >
          {/* Diamond Icon outline */}
          <View style={styles.vipIconContainer}>
            <Icon name="diamond-outline" size={32} color="#FFF" />
          </View>

          {/* Call to Action */}
          <View style={styles.vipInfo}>
            <Text style={styles.vipTitle}>Unlock Pawnder Premium</Text>
            <Text style={styles.vipSubtitle}>
              Unlimited matches, AI confirms & more! ✨
            </Text>
          </View>

          {/* Upgrade Button */}
          <View style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
            <Icon name="arrow-forward" size={16} color="#F5576C" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* VIP Status Card */}
        {renderVipStatusCard()}

        {renderSection("Account", accountSettings)}
        {renderSection("App Settings", appSettings)}
        {renderSection("Premium & Billing", premiumSettings)}
        {renderSection("Support", supportSettings)}
        {renderSection("Danger Zone", dangerSettings)}

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          onClose={hideAlert}
          onConfirm={alertConfig.onConfirm}
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBackgroundLight,
  },
  settingsItemLast: {
    borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
  },
  version: {
    fontSize: 13,
    color: colors.textLabel,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },

  // VIP Status Card
  vipCardContainer: {
    marginBottom: 24,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.large,
  },
  vipCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.xl,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    ...shadows.medium,
  },
  vipCardActive: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: radius.xl,
  },
  vipCardInactive: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: radius.xl,
  },
  vipIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    position: "relative",
  },
  vipIconGlow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
    opacity: 0.3,
  },
  vipInfo: {
    flex: 1,
  },
  vipTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  vipTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginRight: 8,
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  vipSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5576C",
  },
});

export default SettingsScreen;

