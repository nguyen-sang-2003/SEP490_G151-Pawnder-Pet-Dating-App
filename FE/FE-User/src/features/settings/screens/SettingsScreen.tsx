import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { removeAuthToken } from "../../../api/auth";
import { removeItem } from "../../../utils/storage";

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
      icon: "heart-outline",
      title: "Preferences",
      subtitle: "Set your matching preferences",
      onPress: () => navigation.navigate("UserPreference"),
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
      onPress: () => Alert.alert("Coming Soon", "This feature is under development"),
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
      await removeAuthToken();
      await removeItem('userId');
      console.log('🔓 Logged out successfully');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const dangerSettings: SettingsItem[] = [
    {
      icon: "log-out-outline",
      title: "Sign Out",
      onPress: () => {
        Alert.alert(
          "Sign Out",
          "Are you sure you want to sign out?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign Out",
              style: "destructive",
              onPress: handleLogout,
            },
          ]
        );
      },
      iconColor: colors.error,
    },
    {
      icon: "trash-outline",
      title: "Delete Account",
      onPress: () => {
        Alert.alert(
          "Delete Account",
          "This action cannot be undone. All your data will be permanently deleted.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => console.log("Delete account"),
            },
          ]
        );
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
        {renderSection("Account", accountSettings)}
        {renderSection("App Settings", appSettings)}
        {renderSection("Premium & Billing", premiumSettings)}
        {renderSection("Support", supportSettings)}
        {renderSection("Danger Zone", dangerSettings)}

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
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
});

export default SettingsScreen;

