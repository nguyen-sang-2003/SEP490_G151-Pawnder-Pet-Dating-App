import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore: bỏ qua warning type
import Icon from "react-native-vector-icons/MaterialIcons";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import HeartsBackground from "../components/HeartsBackground";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { register, sendOtp } from "../../../api";
import { gradients } from "../../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

const SignUpScreen = ({ navigation }: Props) => {
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSignUp = async () => {
    // Validation: Kiểm tra họ tên
    if (!fullName.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập họ tên của bạn',
      });
      return;
    }

    // Validation: Kiểm tra độ dài họ tên
    if (fullName.trim().length < 2) {
      showAlert({
        type: 'error',
        title: 'Họ tên không hợp lệ',
        message: 'Họ tên phải có ít nhất 2 ký tự',
      });
      return;
    }

    // Validation: Kiểm tra giới tính
    if (!gender) {
      showAlert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn giới tính',
      });
      return;
    }

    // Validation: Kiểm tra email trống
    if (!email.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập email',
      });
      return;
    }

    // Validation: Kiểm tra định dạng email
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      showAlert({
        type: 'error',
        title: 'Email không hợp lệ',
        message: 'Vui lòng nhập đúng định dạng email (ví dụ: example@email.com)',
      });
      return;
    }

    // Validation: Kiểm tra mật khẩu trống
    if (!pass) {
      showAlert({
        type: 'warning',
        title: 'Thiếu mật khẩu',
        message: 'Vui lòng nhập mật khẩu',
      });
      return;
    }

    // Validation: Kiểm tra độ dài tối thiểu 8 ký tự
    if (pass.length < 8) {
      showAlert({
        type: 'error',
        title: 'Mật khẩu quá ngắn',
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
      });
      return;
    }

    // Validation: Kiểm tra có chứa số
    if (!/\d/.test(pass)) {
      showAlert({
        type: 'error',
        title: 'Mật khẩu không hợp lệ',
        message: 'Mật khẩu phải chứa ít nhất 1 chữ số',
      });
      return;
    }

    // Validation: Kiểm tra có ký tự đặc biệt
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      showAlert({
        type: 'error',
        title: 'Mật khẩu không hợp lệ',
        message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)',
      });
      return;
    }

    // Validation: Kiểm tra xác nhận mật khẩu trống
    if (!confirm) {
      showAlert({
        type: 'warning',
        title: 'Thiếu xác nhận mật khẩu',
        message: 'Vui lòng nhập lại mật khẩu để xác nhận',
      });
      return;
    }

    // Validation: Kiểm tra mật khẩu khớp
    if (pass !== confirm) {
      showAlert({
        type: 'error',
        title: 'Mật khẩu không khớp',
        message: 'Mật khẩu xác nhận không giống mật khẩu đã nhập',
      });
      return;
    }

    // Validation: Kiểm tra đồng ý điều khoản
    if (!agree) {
      showAlert({
        type: 'warning',
        title: 'Chưa đồng ý điều khoản',
        message: 'Vui lòng đồng ý với điều khoản và chính sách để tiếp tục',
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
        title: 'Kiểm tra email',
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập mã xác thực.',
        confirmText: 'Xác thực ngay',
        onClose: () => navigation.navigate("OTPVerification", { 
          email: email.trim(),
          userData: userData // Pass user data to OTP screen
        }),
      });
    } catch (error: any) {
      // Xử lý các loại lỗi cụ thể
      let errorTitle = 'Đăng ký thất bại';
      let errorMessage = 'Không thể gửi mã OTP. Vui lòng thử lại.';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        // Email đã tồn tại
        if (msg.includes('exist') || msg.includes('already') || msg.includes('duplicate')) {
          errorTitle = 'Email đã được sử dụng';
          errorMessage = 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập';
        }
        // Lỗi gửi OTP
        else if (msg.includes('otp') || msg.includes('email')) {
          errorTitle = 'Không thể gửi mã xác thực';
          errorMessage = 'Không thể gửi mã OTP đến email. Vui lòng kiểm tra email và thử lại';
        }
        // Lỗi mạng
        else if (msg.includes('network') || msg.includes('timeout') || msg.includes('connection')) {
          errorTitle = 'Lỗi kết nối';
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng';
        }
        // Lỗi khác từ server
        else {
          errorMessage = error.message;
        }
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
        <Text style={styles.title}>Đăng ký</Text>

        <TextInput
          placeholder="Họ và tên"
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
              Nam
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
              Nữ
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Mật khẩu"
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
        />

        {/* Password Requirements - Only show when focused */}
        {isPasswordFocused && pass.length > 0 && (
          <View style={styles.requirementsContainer}>
            <View style={styles.requirement}>
              <Icon
                name={pass.length >= 8 ? "check-circle" : "radio-button-unchecked"}
                size={14}
                color={pass.length >= 8 ? "#4CAF50" : "#999"}
              />
              <Text style={[styles.requirementText, pass.length >= 8 && styles.requirementMet]}>
                Ít nhất 8 ký tự
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={/\d/.test(pass) ? "check-circle" : "radio-button-unchecked"}
                size={14}
                color={/\d/.test(pass) ? "#4CAF50" : "#999"}
              />
              <Text style={[styles.requirementText, /\d/.test(pass) && styles.requirementMet]}>
                Chứa ít nhất 1 chữ số
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={/[!@#$%^&*(),.?":{}|<>]/.test(pass) ? "check-circle" : "radio-button-unchecked"}
                size={14}
                color={/[!@#$%^&*(),.?":{}|<>]/.test(pass) ? "#4CAF50" : "#999"}
              />
              <Text style={[styles.requirementText, /[!@#$%^&*(),.?":{}|<>]/.test(pass) && styles.requirementMet]}>
                Chứa ít nhất 1 ký tự đặc biệt
              </Text>
            </View>
          </View>
        )}

        <View style={styles.passwordInputContainer}>
          <TextInput
            placeholder="Xác nhận mật khẩu"
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

        <Pressable style={styles.checkRow} onPress={() => setAgree((v) => !v)}>
          <View style={[styles.checkbox, agree && styles.checkboxOn]} />
          <Text style={styles.checkText}>Tôi đồng ý với điều khoản và chính sách</Text>
        </Pressable>

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
              <Text style={styles.buttonText}>Đăng ký</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Đã có tài khoản?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("SignIn")}
          >
            Đăng nhập
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

  checkRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FF7AAE",
    marginRight: 8,
    backgroundColor: "transparent",
  },
  checkboxOn: { backgroundColor: "#FF7AAE" },
  checkText: { color: "#222" },

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
