import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { generatePaymentQR } from "../../../api/payment";

type Props = NativeStackScreenProps<RootStackParamList, "QRPayment">;

const QRPaymentScreen = ({ navigation, route }: Props) => {
  const [loading, setLoading] = useState(true);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Payment details from route params
  const { planId, planName, amount, duration } = route.params;

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate payment info text with plan ID for tracking
      const paymentInfo = `PAWNDER ${planId.toUpperCase()} ${Date.now()}`;

      // Call API to generate QR code
      const qrBlob = await generatePaymentQR(amount, paymentInfo);

      // Convert blob to base64 URI for React Native Image
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setQrCodeUri(base64data);
        setLoading(false);
      };
      reader.readAsDataURL(qrBlob);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      setError("Không thể tạo mã QR. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadQRCode();
  };

  const handleDone = () => {
    // Tạm thời coi như thanh toán thành công luôn
    Alert.alert(
      "🎉 Thanh toán thành công!",
      `Bạn đã nâng cấp lên Pawnder Premium (${duration})\n\nCảm ơn bạn đã tin tưởng sử dụng dịch vụ!`,
      [
        {
          text: "Tuyệt vời!",
          onPress: () => {
            // Navigate back to home or settings
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          },
        },
      ]
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
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gói dịch vụ</Text>
            <Text style={styles.infoValue}>{planName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời hạn</Text>
            <Text style={styles.infoValue}>{duration}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số tiền</Text>
            <Text style={styles.amountValue}>{amount.toLocaleString('vi-VN')}₫</Text>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
          <Text style={styles.qrSubtitle}>
            Mở ứng dụng ngân hàng và quét mã QR bên dưới
          </Text>

          <View style={styles.qrContainer}>
            {loading ? (
              <View style={styles.qrLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tạo mã QR...</Text>
              </View>
            ) : error ? (
              <View style={styles.qrError}>
                <Icon name="alert-circle" size={64} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : qrCodeUri ? (
              <Image
                source={{ uri: qrCodeUri }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Mở ứng dụng ngân hàng của bạn
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Chọn chức năng quét mã QR
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Quét mã QR và xác nhận thanh toán
            </Text>
          </View>
        </View>

        {/* Done Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          disabled={loading || !!error}
        >
          <LinearGradient
            colors={gradients.primary}
            style={styles.doneGradient}
          >
            <Text style={styles.doneText}>Đã thanh toán</Text>
            <Icon name="checkmark-circle" size={24} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Giao dịch sẽ được xử lý trong vòng 5-10 phút
        </Text>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 24,
    ...shadows.medium,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 15,
    color: colors.textMedium,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBackgroundLight,
    marginVertical: 16,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },

  // QR Section
  qrSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 8,
    textAlign: "center",
  },
  qrSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 20,
    textAlign: "center",
  },
  qrContainer: {
    width: 280,
    height: 280,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.large,
  },
  qrLoading: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textMedium,
  },
  qrError: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  qrImage: {
    width: 260,
    height: 260,
  },

  // Instructions
  instructions: {
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
  },

  // Done Button
  doneButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 16,
    ...shadows.medium,
  },
  doneGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  doneText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: "center",
    marginBottom: 20,
  },
});

export default QRPaymentScreen;

