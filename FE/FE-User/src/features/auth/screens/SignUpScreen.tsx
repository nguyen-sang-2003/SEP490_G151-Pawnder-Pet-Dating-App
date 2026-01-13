import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore: bỏ qua warning type
import Icon from "react-native-vector-icons/MaterialIcons";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import HeartsBackground from "../components/HeartsBackground";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { register, sendOtp } from "../../../api";
import { gradients } from "../../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

const SignUpScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSignUp = async () => {
    // Validation: Kiểm tra họ tên
    if (!fullName.trim()) {
      showAlert({
        type: 'warning',
        title: t('auth.signUp.missingInfo'),
        message: t('auth.signUp.enterFullName'),
      });
      return;
    }

    // Validation: Kiểm tra độ dài họ tên
    if (fullName.trim().length < 2) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.invalidFullName'),
        message: t('auth.signUp.fullNameMinLength'),
      });
      return;
    }

    // Validation: Kiểm tra giới tính
    if (!gender) {
      showAlert({
        type: 'warning',
        title: t('auth.signUp.missingInfo'),
        message: t('auth.signUp.selectGender'),
      });
      return;
    }

    // Validation: Kiểm tra email trống
    if (!email.trim()) {
      showAlert({
        type: 'warning',
        title: t('auth.signUp.missingInfo'),
        message: t('auth.signUp.enterEmail'),
      });
      return;
    }

    // Validation: Kiểm tra định dạng email
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.invalidEmail'),
        message: t('auth.signUp.invalidEmailFormat'),
      });
      return;
    }

    // Validation: Kiểm tra mật khẩu trống
    if (!pass) {
      showAlert({
        type: 'warning',
        title: t('auth.signUp.missingPassword'),
        message: t('auth.signUp.enterPassword'),
      });
      return;
    }

    // Validation: Kiểm tra độ dài tối thiểu 8 ký tự
    if (pass.length < 8) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.passwordTooShort'),
        message: t('auth.signUp.passwordMinLength'),
      });
      return;
    }

    // Validation: Kiểm tra có chứa chữ hoa
    if (!/[A-Z]/.test(pass)) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.passwordInvalid'),
        message: t('auth.signUp.passwordNeedsUppercase'),
      });
      return;
    }

    // Validation: Kiểm tra có chứa số
    if (!/\d/.test(pass)) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.passwordInvalid'),
        message: t('auth.signUp.passwordNeedsNumber'),
      });
      return;
    }

    // Validation: Kiểm tra có chứa chữ thường (đồng bộ với BE)
    if (!/[a-z]/.test(pass)) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.passwordInvalid'),
        message: t('auth.signUp.passwordNeedsLowercase'),
      });
      return;
    }

    // Validation: Kiểm tra có ký tự đặc biệt
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.passwordInvalid'),
        message: t('auth.signUp.passwordNeedsSpecial'),
      });
      return;
    }

    // Validation: Kiểm tra độ dài tối đa 100 ký tự (đồng bộ với BE)
    if (pass.length > 100) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.passwordInvalid'),
        message: t('auth.signUp.passwordMaxLength'),
      });
      return;
    }

    // Validation: Kiểm tra xác nhận mật khẩu trống
    if (!confirm) {
      showAlert({
        type: 'warning',
        title: t('auth.signUp.missingConfirmPassword'),
        message: t('auth.signUp.enterConfirmPassword'),
      });
      return;
    }

    // Validation: Kiểm tra mật khẩu khớp
    if (pass !== confirm) {
      showAlert({
        type: 'error',
        title: t('auth.signUp.passwordMismatch'),
        message: t('auth.signUp.passwordMismatchMessage'),
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare user data
      const userData = {
        FullName: fullName.trim(),
        Gender: gender,
        Email: email.trim(),
        Password: pass.trim(),
      };

      // Send OTP to email
      await sendOtp(email.trim());

      showAlert({
        type: 'success',
        title: t('auth.signUp.checkEmail'),
        message: t('auth.signUp.otpSent'),
        confirmText: t('auth.signUp.verifyNow'),
        onClose: () => navigation.navigate("OTPVerification", { 
          email: email.trim(),
          userData: userData // Pass user data to OTP screen
        }),
      });
    } catch (error: any) {
      // Xử lý các loại lỗi cụ thể
      let errorTitle = t('auth.signUp.signUpFailed');
      let errorMessage = error.message || t('auth.signUp.otpSendFailed');
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        // Email/Tài khoản đã tồn tại
        if (msg.includes('tồn tại') || msg.includes('exist') || msg.includes('already') || msg.includes('duplicate')) {
          errorTitle = t('auth.signUp.emailExists');
          errorMessage = error.message; // Hiển thị message từ server
        }
        // Lỗi mạng
        else if (msg.includes('network') || msg.includes('timeout') || msg.includes('connection')) {
          errorTitle = t('auth.signIn.connectionError');
          errorMessage = t('auth.signIn.connectionErrorMessage');
        }
        // Lỗi khác từ server - hiển thị message gốc
      }
      
      showAlert({
        type: 'error',
        title: errorTitle,
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradients.auth.signup}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background tim */}
      <HeartsBackground />

      {/* Nút Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>

      {/* Avatar + Circle */}
      <View style={styles.circleWrapper}>
        <LinearGradient
          colors={gradients.auth.buttonSecondary}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.circle}
        />
        <Image
          source={require("../../../assets/cat_avatar.png")}
          style={styles.avatar}
        />
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>{t('auth.signUp.title')}</Text>

        <TextInput
          placeholder={t('auth.signUp.fullName')}
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          value={fullName}
          onChangeText={setFullName}
        />

        {/* Gender Selection */}
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              gender === "Male" && styles.genderBtnActive,
            ]}
            onPress={() => setGender("Male")}
          >
            <Icon
              name="male"
              size={20}
              color={gender === "Male" ? "#fff" : "#FF7AAE"}
            />
            <Text
              style={[
                styles.genderText,
                gender === "Male" && styles.genderTextActive,
              ]}
            >
              {t('auth.signUp.male')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderBtn,
              gender === "Female" && styles.genderBtnActive,
            ]}
            onPress={() => setGender("Female")}
          >
            <Icon
              name="female"
              size={20}
              color={gender === "Female" ? "#fff" : "#FF7AAE"}
            />
            <Text
              style={[
                styles.genderText,
                gender === "Female" && styles.genderTextActive,
              ]}
            >
              {t('auth.signUp.female')}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder={t('auth.signUp.email')}
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          placeholder={t('auth.signUp.password')}
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
        />

        {/* Password Requirements - Only show when focused */}
        {isPasswordFocused && (
          <View style={styles.requirementsContainer}>
            <View style={styles.requirement}>
              <Icon
                name={pass.length >= 8 ? "check-circle" : "radio-button-unchecked"}
                size={14}
                color={pass.length >= 8 ? "#4CAF50" : "#999"}
              />
              <Text style={[styles.requirementText, pass.length >= 8 && styles.requirementMet]}>
                {t('auth.signUp.passwordRequirements.minLength')}
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={/[A-Z]/.test(pass) ? "check-circle" : "radio-button-unchecked"}
                size={14}
                color={/[A-Z]/.test(pass) ? "#4CAF50" : "#999"}
              />
              <Text style={[styles.requirementText, /[A-Z]/.test(pass) && styles.requirementMet]}>
                {t('auth.signUp.passwordRequirements.hasUppercase')}
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={/[a-z]/.test(pass) ? "check-circle" : "radio-button-unchecked"}
                size={14}
                color={/[a-z]/.test(pass) ? "#4CAF50" : "#999"}
              />
              <Text style={[styles.requirementText, /[a-z]/.test(pass) && styles.requirementMet]}>
                {t('auth.signUp.passwordRequirements.hasLowercase')}
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={/\d/.test(pass) ? "check-circle" : "radio-button-unchecked"}
                size={14}
                color={/\d/.test(pass) ? "#4CAF50" : "#999"}
              />
              <Text style={[styles.requirementText, /\d/.test(pass) && styles.requirementMet]}>
                {t('auth.signUp.passwordRequirements.hasNumber')}
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={/[!@#$%^&*(),.?":{}|<>]/.test(pass) ? "check-circle" : "radio-button-unchecked"}
                size={14}
                color={/[!@#$%^&*(),.?":{}|<>]/.test(pass) ? "#4CAF50" : "#999"}
              />
              <Text style={[styles.requirementText, /[!@#$%^&*(),.?":{}|<>]/.test(pass) && styles.requirementMet]}>
                {t('auth.signUp.passwordRequirements.hasSpecial')}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.passwordInputContainer}>
          <TextInput
            placeholder={t('auth.signUp.confirmPassword')}
            style={styles.input}
            placeholderTextColor="#6B6B6B"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />
          {/* Show checkmark if passwords match, X if not match */}
          {confirm && pass && (
            <Icon
              name={confirm === pass ? "check-circle" : "cancel"}
              size={20}
              color={confirm === pass ? "#4CAF50" : "#FF5252"}
              style={styles.checkIcon}
            />
          )}
        </View>

        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.btnShadow}
          onPress={handleSignUp}
          disabled={loading}
        >
          <LinearGradient
            colors={gradients.auth.buttonPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.signUp.button')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>
          {t('auth.signUp.hasAccount')}{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("SignIn")}
          >
            {t('auth.signUp.signInLink')}
          </Text>
        </Text>
      </View>

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
  container: { flex: 1, alignItems: "center", padding: 20 },

  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    padding: 6,
  },

  circleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    position: "relative",
    width: 210,
    height: 210,
  },
  circle: {
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  avatar: {
    width: 250,
    height: 280,
    resizeMode: "contain",
    position: "absolute",
  },

  form: {
    width: "100%",
    alignItems: "center",
    marginTop: 30, // đẩy form xuống dưới avatar
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
    color: "#333",
  },
  input: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  passwordInputContainer: {
    width: "100%",
    position: "relative",
  },
  checkIcon: {
    position: "absolute",
    right: 16,
    top: 14,
  },

  // Password Requirements
  requirementsContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    color: "#999",
  },
  requirementMet: {
    color: "#4CAF50",
    fontWeight: "600",
  },

  // Gender
  genderRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  genderBtnActive: {
    backgroundColor: "#FF7AAE",
    borderColor: "#FF7AAE",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  genderTextActive: {
    color: "#fff",
  },

  btnShadow: {
    marginTop: 10,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 64,
    borderRadius: 26,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  footer: { marginTop: 18, fontSize: 14 },
  link: { fontWeight: "bold", textDecorationLine: "underline" },
});

export default SignUpScreen;
