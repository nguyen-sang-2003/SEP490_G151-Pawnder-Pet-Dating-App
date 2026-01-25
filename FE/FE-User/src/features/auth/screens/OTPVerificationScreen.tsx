import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { sendOtp, verifyOtp, register, createAddressForUser, login } from "../../../api";
import { requestLocationAndGetCoordinates } from "../../../services/location.service";
import { setItem } from "../../../services/storage";
import { disablePolicyCheck } from "../../../services/policyEventEmitter";

type Props = NativeStackScreenProps<RootStackParamList, "OTPVerification">;

const OTPVerificationScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { email, userData } = route.params;
  const [otpValue, setOtpValue] = useState(""); // Một string thay vì array
  const [resendTimer, setResendTimer] = useState(60);
  const [otpValidTimer, setOtpValidTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const hiddenInputRef = useRef<TextInput | null>(null);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  // Resend timer (60s)
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // OTP validity timer (5 minutes)
  useEffect(() => {
    if (otpValidTimer > 0 && !isOtpExpired) {
      const interval = setInterval(() => {
        setOtpValidTimer((prev) => {
          if (prev <= 1) {
            setIsOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpValidTimer, isOtpExpired]);

  // Show alert when OTP expires
  useEffect(() => {
    if (isOtpExpired) {
      showAlert({
        type: 'warning',
        title: t('auth.otp.otpExpired'),
        message: t('auth.otp.otpExpiredAlert'),
      });
    }
  }, [isOtpExpired]);

  // Xử lý thay đổi OTP - dùng một input ẩn
  const handleOtpChange = (value: string) => {
    // Chỉ lấy số và giới hạn 6 ký tự
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtpValue(digits);
  };

  // Lấy array 6 phần tử để hiển thị
  const getOtpDigits = () => {
    const digits = otpValue.split('');
    while (digits.length < 6) {
      digits.push('');
    }
    return digits;
  };

  // Focus vào input ẩn khi bấm vào ô nào đó
  const handleBoxPress = () => {
    hiddenInputRef.current?.focus();
  };

  const handleVerify = async () => {
    // Validation: Kiểm tra OTP đầy đủ 6 số
    if (otpValue.length !== 6) {
      showAlert({
        type: 'warning',
        title: t('auth.otp.otpIncomplete'),
        message: t('auth.otp.enterFullOtp'),
      });
      return;
    }

    if (isOtpExpired) {
      showAlert({
        type: 'error',
        title: t('auth.otp.otpExpired'),
        message: t('auth.otp.otpExpiredMessage'),
      });
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otpValue);

      // Show OTP success message first
      showAlert({
        type: 'success',
        title: t('auth.otp.otpCorrect'),
        message: t('auth.otp.otpCorrectMessage'),
        confirmText: t('common.continue'),
        onClose: async () => {
          // Step 2: Create account in database
          if (userData) {
            try {
              setLoading(true);
              const registerResponse = await register(userData);
              const newUserId = registerResponse.userId || registerResponse.UserId;

              if (!newUserId) {
                throw new Error('Không thể lấy UserId từ response');
              }

              await setItem('userId', newUserId.toString());

              // Disable policy checks during registration flow
              // Policy will be checked AFTER user completes pet creation and preferences
              disablePolicyCheck();

              try {
                await login(userData.Email, userData.Password);
              } catch (loginError: any) {
                // Silent fail - user can login manually later
              }

              setLoading(false);

              // Step 3: Request location permission and get GPS
              showAlert({
                type: 'info',
                title: t('auth.otp.locationPermission'),
                message: t('auth.otp.locationPermissionMessage'),
                confirmText: t('auth.otp.agree'),
                onClose: () => {
                  // Request location in background
                  handleLocationSetup(newUserId);
                },
              });
            } catch (error: any) {
              setLoading(false);


              let errorTitle = t('auth.otp.createAccountFailed');
              let errorMessage = error.message || t('auth.signIn.genericError');

              // Check if error is from registration
              if (error.message?.includes('Email') || error.message?.includes('đã tồn tại')) {
                errorTitle = t('auth.signUp.emailExists');
                errorMessage = t('auth.signUp.emailExistsMessage');
              }

              showAlert({
                type: 'error',
                title: errorTitle,
                message: errorMessage,
              });
            }
          } else {
            // If no userData (e.g., forgot password flow), just navigate
            setLoading(false);
            showAlert({
              type: 'success',
              title: t('auth.otp.verifySuccess'),
              message: t('auth.otp.emailVerified'),
              confirmText: t('common.continue'),
              onClose: () => navigation.replace("Home"),
            });
          }
        },
      });
    } catch (error: any) {


      showAlert({
        type: 'error',
        title: t('auth.otp.verifyFailed'),
        message: error.message || t('auth.otp.wrongOtp'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSetup = async (newUserId: number) => {
    try {
      setLoading(true);

      const coordinates = await requestLocationAndGetCoordinates();

      if (!coordinates) {
        showAlert({
          type: 'warning',
          title: t('auth.otp.locationSkipped'),
          message: t('auth.otp.locationSkippedMessage'),
          confirmText: t('common.continue'),
          onClose: () => navigation.replace("AddPetBasicInfo", { isFromProfile: false }),
        });
        return;
      }

      await createAddressForUser(newUserId, coordinates.latitude, coordinates.longitude);

      showAlert({
        type: 'success',
        title: t('auth.otp.registrationComplete'),
        message: t('auth.otp.locationSaved'),
        confirmText: t('common.continue'),
        onClose: () => navigation.replace("AddPetBasicInfo", { isFromProfile: false }),
      });
    } catch (error: any) {


      // Show error but allow user to continue
      showAlert({
        type: 'warning',
        title: t('auth.otp.locationSaveFailed'),
        message: error.message + ' ' + t('auth.otp.locationSaveFailedMessage'),
        confirmText: t('common.continue'),
        onClose: () => navigation.replace("AddPetBasicInfo", { isFromProfile: false }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      await sendOtp(email);

      setResendTimer(60);
      setOtpValidTimer(300); // Reset to 5 minutes
      setCanResend(false);
      setIsOtpExpired(false);
      setOtpValue("");
      hiddenInputRef.current?.focus();

      showAlert({
        type: 'success',
        title: t('auth.otp.resendSuccess'),
        message: t('auth.otp.resendSuccessMessage'),
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('auth.otp.resendFailed'),
        message: error.message || t('auth.otp.resendFailedMessage'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradients.auth.forgot}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={gradients.auth.buttonSecondary}
              style={styles.iconGradient}
            >
              <Icon name="mail-outline" size={48} color={colors.white} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('auth.otp.title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.otp.subtitle')}{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>

          {/* OTP Validity Timer */}
          <View style={styles.validityContainer}>
            <Icon
              name="time-outline"
              size={16}
              color={isOtpExpired ? colors.error : otpValidTimer <= 60 ? colors.warning : colors.primary}
            />
            <Text style={[
              styles.validityText,
              isOtpExpired && styles.expiredText,
              otpValidTimer <= 60 && !isOtpExpired && styles.warningText,
            ]}>
              {isOtpExpired
                ? t('auth.otp.codeExpired')
                : t('auth.otp.codeValidity', { minutes: Math.floor(otpValidTimer / 60), seconds: String(otpValidTimer % 60).padStart(2, '0') })}
            </Text>
          </View>

          {/* OTP Input - Hidden input + Visual boxes */}
          <View style={styles.otpWrapper}>
            {/* Hidden TextInput để nhận input */}
            <TextInput
              ref={hiddenInputRef}
              style={styles.hiddenInput}
              value={otpValue}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              caretHidden
            />
            
            {/* Visual OTP boxes */}
            <TouchableOpacity 
              style={styles.otpContainer} 
              onPress={handleBoxPress}
              activeOpacity={1}
            >
              {getOtpDigits().map((digit, index) => (
                <View
                  key={index}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                    index === otpValue.length && styles.otpInputFocused,
                  ]}
                >
                  <Text style={styles.otpDigitText}>{digit}</Text>
                </View>
              ))}
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerify}
            disabled={loading}
          >
            <LinearGradient
              colors={gradients.auth.buttonPrimary}
              style={styles.verifyGradient}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.verifyText}>{t('auth.otp.verifyButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={loading}>
                <Text style={styles.resendText}>
                  {t('auth.otp.noCode')}{" "}
                  <Text style={styles.resendLink}>{t('auth.otp.resend')}</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                {t('auth.otp.resendIn', { seconds: resendTimer })}
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          onClose={hideAlert}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.large,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: colors.primary,
  },
  validityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: radius.lg,
    marginBottom: 24,
  },
  validityText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  warningText: {
    color: colors.warning,
  },
  expiredText: {
    color: colors.error,
  },
  otpWrapper: {
    position: "relative",
    marginBottom: 40,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.whiteWarm,
    borderWidth: 2,
    borderColor: colors.cardBackgroundLight,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  otpInputFocused: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  otpDigitText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
  },
  verifyButton: {
    width: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 20,
  },
  verifyGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  verifyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  timerText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  timerNumber: {
    fontWeight: "600",
    color: colors.primary,
  },
});

export default OTPVerificationScreen;

