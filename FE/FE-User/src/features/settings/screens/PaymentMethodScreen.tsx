import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentMethod">;

const PaymentMethodScreen = ({ navigation }: Props) => {
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

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
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon
            name="information-circle-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Hiện tại Pawnder chỉ hỗ trợ thanh toán qua chuyển khoản ngân hàng bằng mã QR
          </Text>
        </View>

        {/* Current Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          
          <View style={styles.methodCard}>
            <View style={styles.methodLeft}>
              <View style={styles.methodIcon}>
                <Icon name="qr-code-outline" size={32} color={colors.primary} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Chuyển khoản QR</Text>
                <Text style={styles.methodDetails}>Quét mã QR để thanh toán qua ngân hàng</Text>
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Phương thức mặc định</Text>
                </View>
              </View>
            </View>
            <View style={styles.checkmarkContainer}>
              <Icon name="checkmark-circle" size={32} color={colors.success} />
            </View>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.supportedSection}>
          <Text style={styles.supportedTitle}>Cách thức hoạt động</Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Chọn gói Premium</Text>
                <Text style={styles.stepDescription}>
                  Chọn gói phù hợp với nhu cầu của bạn
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Quét mã QR</Text>
                <Text style={styles.stepDescription}>
                  Mở ứng dụng ngân hàng và quét mã QR để thanh toán
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Kích hoạt tự động</Text>
                <Text style={styles.stepDescription}>
                  Tài khoản Premium sẽ được kích hoạt ngay sau khi thanh toán thành công
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Supported Banks */}
        <View style={styles.supportedSection}>
          <Text style={styles.supportedTitle}>Ngân hàng hỗ trợ</Text>
          <Text style={styles.supportedDescription}>
            Hỗ trợ tất cả ngân hàng tại Việt Nam có tích hợp VietQR
          </Text>
          <View style={styles.supportedMethods}>
            <View style={styles.supportedMethod}>
              <Icon name="business-outline" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>Vietcombank</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="business-outline" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>Techcombank</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="business-outline" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>VietinBank</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="business-outline" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>BIDV</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="business-outline" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>MB Bank</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="ellipsis-horizontal" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>Và nhiều hơn</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.success}15`,
    padding: 14,
    borderRadius: radius.md,
    gap: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
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
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 4,
  },
  methodDetails: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 6,
  },
  defaultBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  defaultText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  methodActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: `${colors.primary}15`,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  supportedSection: {
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: radius.lg,
    padding: 20,
  },
  supportedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 16,
  },
  supportedDescription: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 16,
    lineHeight: 20,
  },
  supportedMethods: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  supportedMethod: {
    alignItems: "center",
    width: "30%",
  },
  supportedText: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 6,
    textAlign: "center",
  },
  stepContainer: {
    gap: 20,
  },
  stepItem: {
    flexDirection: "row",
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
});

export default PaymentMethodScreen;

