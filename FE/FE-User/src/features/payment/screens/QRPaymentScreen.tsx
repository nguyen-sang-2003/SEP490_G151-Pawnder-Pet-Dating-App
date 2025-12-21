import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  AppState,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { generatePaymentQR, verifyPayment } from "../api/paymentApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "QRPayment">;

// Constants
const QR_TIMEOUT_SECONDS = 10 * 60; // 10 minutes
const POLLING_INTERVAL_MS = 5000; // 5 seconds

const QRPaymentScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [loading, setLoading] = useState(true);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(QR_TIMEOUT_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Refs for intervals
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const paymentSuccessRef = useRef(false);

  // Payment details from route params
  const { planId, planName, amount, duration } = route.params;

  // Calculate months from planId
  const getMonthsFromPlanId = useCallback((id: string): number => {
    const durationMonthsMap: { [key: string]: number } = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '12months': 12,
    };
    return durationMonthsMap[id] || 1;
  }, []);

  // Auto verify payment (polling)
  const checkPaymentStatus = useCallback(async () => {
    if (paymentSuccessRef.current || isExpired) return;

    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) return;

      const userId = parseInt(userIdStr);
      if (!userId || isNaN(userId)) return;

      const months = getMonthsFromPlanId(planId);
      const response = await verifyPayment(amount, userId, months);

      if (response.success && response.paid) {
        // Payment verified successfully!
        paymentSuccessRef.current = true;
        stopPolling();
        stopCountdown();

        showAlert({
          type: 'success',
          title: t("payment.qr.success.title"),
          message: t("payment.qr.success.message", { planName, duration }),
          confirmText: t("payment.qr.success.button"),
          onConfirm: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          },
        });
      }
    } catch (err) {
      // Silent fail - will retry on next poll
    }
  }, [amount, planId, planName, duration, isExpired, navigation, showAlert, t, getMonthsFromPlanId]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(checkPaymentStatus, POLLING_INTERVAL_MS);
  }, [checkPaymentStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Start countdown
  const startCountdown = useCallback(() => {
    if (countdownIntervalRef.current) return;
    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up!
          stopPolling();
          stopCountdown();
          setIsExpired(true);
          showAlert({
            type: 'warning',
            title: t("payment.qr.expired.title"),
            message: t("payment.qr.expired.message"),
            confirmText: t("payment.qr.expired.button"),
            onConfirm: () => {
              navigation.goBack();
            },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [navigation, showAlert, stopPolling, t]);

  // Stop countdown
  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, [stopPolling, stopCountdown]);

  // Handle app state changes (pause polling when app is in background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && !isExpired && !paymentSuccessRef.current) {
        // App came to foreground - check immediately and resume polling
        checkPaymentStatus();
        startPolling();
      } else if (nextAppState === 'background') {
        // App went to background - stop polling to save battery
        stopPolling();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPaymentStatus, isExpired, startPolling, stopPolling]);

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsExpired(false);
      setTimeRemaining(QR_TIMEOUT_SECONDS);
      paymentSuccessRef.current = false;

      const months = getMonthsFromPlanId(planId);

      // Call API to generate QR code with amount and months
      const qrBlob = await generatePaymentQR(amount, months);

      // Convert blob to base64 URI for React Native Image
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setQrCodeUri(base64data);
        setLoading(false);
        
        // Start countdown and polling after QR is loaded
        startCountdown();
        startPolling();
      };
      reader.readAsDataURL(qrBlob);
    } catch (err) {
      setError(t("payment.qr.generateError"));
      setLoading(false);
    }
  };

  const handleRetry = () => {
    stopPolling();
    stopCountdown();
    loadQRCode();
  };

  const handleDone = async () => {
    if (isExpired) {
      navigation.goBack();
      return;
    }

    try {
      setProcessing(true);

      // Get userId from AsyncStorage
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setProcessing(false);
        showAlert({
          type: 'error',
          title: t("payment.qr.error.title"),
          message: t("payment.qr.error.userNotFound"),
        });
        return;
      }

      const userId = parseInt(userIdStr);
      if (!userId || isNaN(userId)) {
        setProcessing(false);
        showAlert({
          type: 'error',
          title: t("payment.qr.error.title"),
          message: t("payment.qr.error.invalidUser"),
        });
        return;
      }

      const months = getMonthsFromPlanId(planId);
      const response = await verifyPayment(amount, userId, months);

      setProcessing(false);

      if (response.success && response.paid) {
        // Payment verified successfully - VIP activated!
        paymentSuccessRef.current = true;
        stopPolling();
        stopCountdown();
        
        showAlert({
          type: 'success',
          title: t("payment.qr.success.title"),
          message: t("payment.qr.success.message", { planName, duration }),
          confirmText: t("payment.qr.success.button"),
          onConfirm: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          },
        });
      } else if (!response.paid) {
        // Payment not found
        showAlert({
          type: 'warning',
          title: t("payment.qr.notFound.title"),
          message: response.message || t("payment.qr.notFound.message"),
          confirmText: t("payment.qr.notFound.tryAgain"),
        });
      } else {
        showAlert({
          type: 'error',
          title: t("payment.qr.error.title"),
          message: response.message || t("payment.qr.error.paymentFailed"),
        });
      }
    } catch (err: any) {
      setProcessing(false);
      const errorMessage = err.response?.data?.message || t("payment.qr.error.genericError");
      showAlert({
        type: 'error',
        title: t("payment.qr.error.paymentError"),
        message: errorMessage,
      });
    }
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
        <Text style={styles.headerTitle}>{t("payment.qr.title")}</Text>
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
            <Text style={styles.infoLabel}>{t("payment.qr.planLabel")}</Text>
            <Text style={styles.infoValue}>{planName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("payment.qr.durationLabel")}</Text>
            <Text style={styles.infoValue}>{duration}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("payment.qr.amountLabel")}</Text>
            <Text style={styles.amountValue}>{amount.toLocaleString('vi-VN')}₫</Text>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>{t("payment.qr.scanTitle")}</Text>
          <Text style={styles.qrSubtitle}>
            {t("payment.qr.scanSubtitle")}
          </Text>

          {/* Countdown Timer */}
          {!loading && !error && !isExpired && (
            <View style={styles.timerContainer}>
              <Icon name="time-outline" size={18} color={timeRemaining <= 60 ? colors.error : colors.primary} />
              <Text style={[
                styles.timerText,
                timeRemaining <= 60 && styles.timerTextWarning
              ]}>
                {t("payment.qr.timeRemaining")}: {formatTime(timeRemaining)}
              </Text>
            </View>
          )}

          {/* Auto-check indicator */}
          {isPolling && !isExpired && (
            <View style={styles.pollingIndicator}>
              <ActivityIndicator size="small" color={colors.success} />
              <Text style={styles.pollingText}>{t("payment.qr.autoChecking")}</Text>
            </View>
          )}

          <View style={styles.qrContainer}>
            {loading ? (
              <View style={styles.qrLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{t("payment.qr.generating")}</Text>
              </View>
            ) : error ? (
              <View style={styles.qrError}>
                <Icon name="alert-circle" size={64} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryText}>{t("payment.qr.retry")}</Text>
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
              {t("payment.qr.instructions.step1")}
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              {t("payment.qr.instructions.step2")}
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              {t("payment.qr.instructions.step3")}
            </Text>
          </View>
        </View>

        {/* Done Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          disabled={loading || !!error || processing}
        >
          <LinearGradient
            colors={gradients.primary}
            style={styles.doneGradient}
          >
            {processing ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.doneText}>{t("payment.qr.processing")}</Text>
              </>
            ) : (
              <>
                <Text style={styles.doneText}>{t("payment.qr.doneButton")}</Text>
                <Icon name="checkmark-circle" size={24} color={colors.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          {t("payment.qr.disclaimer")}
        </Text>
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
    marginBottom: 12,
    textAlign: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.cardBackgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  timerTextWarning: {
    color: colors.error,
  },
  pollingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  pollingText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: "500",
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

