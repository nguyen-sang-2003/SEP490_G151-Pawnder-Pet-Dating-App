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

interface PaymentMethod {
  id: string;
  type: "card" | "paypal" | "applepay" | "googlepay";
  name: string;
  details: string;
  isDefault: boolean;
  icon: string;
}

const MOCK_METHODS: PaymentMethod[] = [
  {
    id: "1",
    type: "card",
    name: "Visa",
    details: "•••• •••• •••• 4242",
    isDefault: true,
    icon: "card-outline",
  },
  {
    id: "2",
    type: "paypal",
    name: "PayPal",
    details: "user@example.com",
    isDefault: false,
    icon: "logo-paypal",
  },
];

const PaymentMethodScreen = ({ navigation }: Props) => {
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(MOCK_METHODS);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === methodId,
      }))
    );
    showAlert({ type: 'success', title: "Thành công", message: "Đã cập nhật phương thức thanh toán mặc định" });
  };

  const handleRemoveMethod = (methodId: string, methodName: string) => {
    showAlert({
      type: 'warning',
      title: "Xóa phương thức thanh toán",
      message: `Bạn có chắc muốn xóa ${methodName}?`,
      showCancel: true,
      confirmText: "Xóa",
      onConfirm: () => {
        setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
        showAlert({ type: 'success', title: "Đã xóa", message: `${methodName} đã bị xóa` });
      },
    });
  };

  const handleAddMethod = () => {
    showAlert({
      type: 'info',
      title: "Thêm phương thức thanh toán",
      message: "Tính năng đang phát triển",
    });
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.methodCard}>
      <View style={styles.methodLeft}>
        <View style={styles.methodIcon}>
          <Icon name={method.icon} size={24} color={colors.primary} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodName}>{method.name}</Text>
          <Text style={styles.methodDetails}>{method.details}</Text>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.methodActions}>
        {!method.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(method.id)}
          >
            <Text style={styles.actionButtonText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleRemoveMethod(method.id, method.name)}
        >
          <Icon name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
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
            name="shield-checkmark-outline"
            size={20}
            color={colors.success}
          />
          <Text style={styles.infoText}>
            Your payment information is encrypted and secure
          </Text>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Methods</Text>
          {paymentMethods.map(renderPaymentMethod)}
        </View>

        {/* Add New Method */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMethod}
        >
          <View style={styles.addButtonContent}>
            <Icon name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.addButtonText}>Add New Payment Method</Text>
          </View>
        </TouchableOpacity>

        {/* Supported Methods */}
        <View style={styles.supportedSection}>
          <Text style={styles.supportedTitle}>Supported Payment Methods</Text>
          <View style={styles.supportedMethods}>
            <View style={styles.supportedMethod}>
              <Icon name="card-outline" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>Credit Card</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="card-outline" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>Debit Card</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="logo-paypal" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>PayPal</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="logo-apple" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>Apple Pay</Text>
            </View>
            <View style={styles.supportedMethod}>
              <Icon name="logo-google" size={32} color={colors.textMedium} />
              <Text style={styles.supportedText}>Google Pay</Text>
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
  addButton: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
    borderStyle: "dashed",
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
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
});

export default PaymentMethodScreen;

