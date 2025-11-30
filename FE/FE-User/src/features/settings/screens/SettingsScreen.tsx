import React, { useState } from "react";
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
import { logout } from "../../auth/api/authApi";
import { getItem } from "../../../services/storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { getVipStatus, VipStatusResponse } from "../../payment/api/paymentApi";

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

    } finally {
      setLoadingVip(false);
    }
  };

  const accountSettings: SettingsItem[] = [
    {
      icon: "person-outline",
      title: "Chỉnh sửa hồ sơ",
      subtitle: "Cập nhật thông tin cá nhân",
      onPress: () => navigation.navigate("EditProfile", {}),
    },
    {
      icon: "paw-outline",
      title: "Thú cưng của tôi",
      subtitle: "Quản lý hồ sơ thú cưng",
      onPress: () => navigation.navigate("Profile"),
    },
    {
      icon: "key-outline",
      title: "Đổi mật khẩu",
      subtitle: "Cập nhật mật khẩu",
      onPress: () => navigation.navigate("ChangePassword"),
    },
  ];

  const appSettings: SettingsItem[] = [
    {
      icon: "shield-checkmark-outline",
      title: "Xác nhận chuyên gia",
      subtitle: "Xem phản hồi AI đã được chuyên gia xác nhận",
      onPress: () => navigation.navigate("ExpertConfirmation"),
    },
    {
      icon: "ban-outline",
      title: "Người dùng bị chặn",
      subtitle: "Quản lý tài khoản đã chặn",
      onPress: () => navigation.navigate("BlockedUsers"),
    },
    {
      icon: "flag-outline",
      title: "Báo cáo của tôi",
      subtitle: "Xem nội dung đã báo cáo",
      onPress: () => navigation.navigate("MyReports"),
    },
    {
      icon: "notifications-outline",
      title: "Thông báo",
      subtitle: "Xem thông báo của bạn",
      onPress: () => navigation.navigate("Notification"),
    },
  ];

  const supportSettings: SettingsItem[] = [
    {
      icon: "help-circle-outline",
      title: "Trợ giúp & Hỗ trợ",
      subtitle: "Nhận trợ giúp và liên hệ hỗ trợ",
      onPress: () => navigation.navigate("HelpAndSupport"),
    },
    {
      icon: "document-text-outline",
      title: "Điều khoản & Điều kiện",
      subtitle: "Đọc điều khoản dịch vụ",
      onPress: () => navigation.navigate("ResourceDetail", { type: "terms" }),
    },
    {
      icon: "shield-outline",
      title: "Chính sách bảo mật",
      subtitle: "Đọc chính sách bảo mật",
      onPress: () => navigation.navigate("ResourceDetail", { type: "privacy" }),
    },
  ];

  const premiumSettings: SettingsItem[] = [
    {
      icon: "diamond-outline",
      title: "Pawnder Premium",
      subtitle: "Mở khóa tính năng độc quyền",
      onPress: () => navigation.navigate("Premium"),
      iconColor: colors.primary,
    },
    {
      icon: "receipt-outline",
      title: "Lịch sử thanh toán",
      subtitle: "Xem lịch sử giao dịch",
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
      title: "Đăng xuất",
      onPress: () => {
        showAlert({
          type: 'warning',
          title: "Đăng xuất",
          message: "Bạn có chắc muốn đăng xuất?",
          showCancel: true,
          confirmText: "Đăng xuất",
          onConfirm: handleLogout,
        });
      },
      iconColor: colors.error,
    },
    {
      icon: "trash-outline",
      title: "Xóa tài khoản",
      onPress: () => {
        showAlert({
          type: 'error',
          title: "Xóa tài khoản",
          message: "Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.",
          showCancel: true,
          confirmText: "Xóa",
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
                  <Text style={styles.vipBadgeText}>ĐANG HOẠT ĐỘNG</Text>
                </View>
              </View>
              <Text style={styles.vipSubtitle}>
                Hết hạn vào {formattedDate} • Còn {daysRemaining} ngày
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
            <Text style={styles.vipTitle}>Mở khóa Pawnder Premium</Text>
            <Text style={styles.vipSubtitle}>
              Kết nối không giới hạn, xác nhận AI & nhiều hơn nữa! ✨
            </Text>
          </View>

          {/* Upgrade Button */}
          <View style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Nâng cấp</Text>
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
        <Text style={styles.headerTitle}>Cài đặt</Text>
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

        {renderSection("Tài khoản", accountSettings)}
        {renderSection("Cài đặt ứng dụng", appSettings)}
        {renderSection("Premium & Thanh toán", premiumSettings)}
        {renderSection("Hỗ trợ", supportSettings)}
        {renderSection("Vùng nguy hiểm", dangerSettings)}

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

