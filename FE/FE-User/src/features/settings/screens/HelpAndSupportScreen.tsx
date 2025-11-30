import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "HelpAndSupport">;

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "Làm thế nào để tạo hồ sơ thú cưng?",
    answer:
      "Sau khi đăng ký, bạn sẽ được nhắc thêm thông tin thú cưng bao gồm tên, giống, tuổi và ảnh. Bạn cũng có thể thêm đặc điểm tính cách để tìm bạn đời phù hợp hơn!",
  },
  {
    id: "2",
    question: "'Kết nối' có nghĩa là gì?",
    answer:
      "Kết nối xảy ra khi cả bạn và người dùng khác đều thích thú cưng của nhau. Sau khi kết nối, bạn có thể bắt đầu trò chuyện và sắp xếp các buổi gặp gỡ!",
  },
  {
    id: "3",
    question: "Làm thế nào để báo cáo hành vi không phù hợp?",
    answer:
      "Đi đến hồ sơ người dùng, nhấn nút menu và chọn 'Báo cáo'. Bạn cũng có thể truy cập từ cài đặt Quyền riêng tư & An toàn.",
  },
  {
    id: "4",
    question: "Tôi có thể thay đổi thông tin thú cưng không?",
    answer:
      "Có! Đi đến Hồ sơ của bạn, nhấn vào thẻ thú cưng và bạn có thể chỉnh sửa tất cả thông tin bao gồm ảnh, tuổi và đặc điểm tính cách.",
  },
  {
    id: "5",
    question: "Thành viên Premium là gì?",
    answer:
      "Thành viên Premium nhận được lượt thích không giới hạn, có thể xem ai đã thích họ, nhận hỗ trợ ưu tiên và mở khóa các bộ lọc độc quyền!",
  },
];

const HelpAndSupportScreen = ({ navigation }: Props) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Support message:", message);
      setMessage("");
      showAlert({ type: 'success', title: "Thành công", message: "Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi sớm." });
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@pawnder.com");
  };

  const handleCallSupport = () => {
    Linking.openURL("tel:+84999999999");
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
        <Text style={styles.headerTitle}>Trợ giúp & Hỗ trợ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liên hệ với chúng tôi</Text>

          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={handleEmailSupport}
            >
              <View style={styles.contactIcon}>
                <LinearGradient
                  colors={["#FF6EA7", "#FF9BC0"]}
                  style={styles.iconGradient}
                >
                  <Icon name="mail" size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.contactText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={handleCallSupport}
            >
              <View style={styles.contactIcon}>
                <LinearGradient
                  colors={["#9C27B0", "#BA68C8"]}
                  style={styles.iconGradient}
                >
                  <Icon name="call" size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.contactText}>Gọi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <LinearGradient
                  colors={["#FF9800", "#FFB74D"]}
                  style={styles.iconGradient}
                >
                  <Icon name="chatbubbles" size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.contactText}>Trò chuyện trực tiếp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>

          <View style={styles.faqContainer}>
            {faqs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqCard}
                onPress={() => toggleFAQ(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Icon
                    name="help-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Icon
                    name={
                      expandedId === faq.id
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color={colors.textMedium}
                  />
                </View>
                {expandedId === faq.id && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Send Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gửi tin nhắn cho chúng tôi</Text>

          <View style={styles.messageCard}>
            <TextInput
              style={styles.messageInput}
              placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..."
              placeholderTextColor={colors.textLabel}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              <LinearGradient
                colors={gradients.primary}
                style={styles.sendGradient}
              >
                <Text style={styles.sendText}>Gửi tin nhắn</Text>
                <Icon name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài nguyên & Chính sách</Text>

          <View style={styles.resourcesGrid}>
            {/* Terms of Service */}
            <TouchableOpacity 
              style={styles.resourceCardNew}
              onPress={() => navigation.navigate("ResourceDetail", { type: "terms" })}
            >
              <LinearGradient
                colors={["#FF6EA7", "#FF9BC0"]}
                style={styles.resourceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.resourceIconBox}>
                  <Icon name="document-text" size={32} color="#fff" />
                </View>
                <Text style={styles.resourceTitleNew}>Điều khoản dịch vụ</Text>
                <Text style={styles.resourceDescNew}>
                  Đọc điều khoản và điều kiện của chúng tôi
                </Text>
                <View style={styles.resourceArrow}>
                  <Icon name="arrow-forward" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity 
              style={styles.resourceCardNew}
              onPress={() => navigation.navigate("ResourceDetail", { type: "privacy" })}
            >
              <LinearGradient
                colors={["#9C27B0", "#BA68C8"]}
                style={styles.resourceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.resourceIconBox}>
                  <Icon name="shield-checkmark" size={32} color="#fff" />
                </View>
                <Text style={styles.resourceTitleNew}>Chính sách bảo mật</Text>
                <Text style={styles.resourceDescNew}>
                  Cách chúng tôi bảo vệ dữ liệu của bạn
                </Text>
                <View style={styles.resourceArrow}>
                  <Icon name="arrow-forward" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Community Guidelines */}
            <TouchableOpacity 
              style={styles.resourceCardNew}
              onPress={() => navigation.navigate("ResourceDetail", { type: "community" })}
            >
              <LinearGradient
                colors={["#FF9800", "#FFB74D"]}
                style={styles.resourceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.resourceIconBox}>
                  <Icon name="people" size={32} color="#fff" />
                </View>
                <Text style={styles.resourceTitleNew}>Hướng dẫn cộng đồng</Text>
                <Text style={styles.resourceDescNew}>
                  Quy tắc tương tác tôn trọng
                </Text>
                <View style={styles.resourceArrow}>
                  <Icon name="arrow-forward" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* User Guide */}
            <TouchableOpacity 
              style={styles.resourceCardNew}
              onPress={() => navigation.navigate("ResourceDetail", { type: "guide" })}
            >
              <LinearGradient
                colors={["#4CAF50", "#81C784"]}
                style={styles.resourceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.resourceIconBox}>
                  <Icon name="book" size={32} color="#fff" />
                </View>
                <Text style={styles.resourceTitleNew}>Hướng dẫn người dùng</Text>
                <Text style={styles.resourceDescNew}>
                  Tìm hiểu cách sử dụng Pawnder
                </Text>
                <View style={styles.resourceArrow}>
                  <Icon name="arrow-forward" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Safety Tips */}
            <TouchableOpacity 
              style={styles.resourceCardNew}
              onPress={() => navigation.navigate("ResourceDetail", { type: "safety" })}
            >
              <LinearGradient
                colors={["#2196F3", "#64B5F6"]}
                style={styles.resourceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.resourceIconBox}>
                  <Icon name="bulb" size={32} color="#fff" />
                </View>
                <Text style={styles.resourceTitleNew}>Mẹo an toàn</Text>
                <Text style={styles.resourceDescNew}>
                  Giữ an toàn trên Pawnder
                </Text>
                <View style={styles.resourceArrow}>
                  <Icon name="arrow-forward" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* About Us */}
            <TouchableOpacity 
              style={styles.resourceCardNew}
              onPress={() => navigation.navigate("ResourceDetail", { type: "about" })}
            >
              <LinearGradient
                colors={["#607D8B", "#90A4AE"]}
                style={styles.resourceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.resourceIconBox}>
                  <Icon name="information-circle" size={32} color="#fff" />
                </View>
                <Text style={styles.resourceTitleNew}>Về Pawnder</Text>
                <Text style={styles.resourceDescNew}>
                  Sứ mệnh và câu chuyện của chúng tôi
                </Text>
                <View style={styles.resourceArrow}>
                  <Icon name="arrow-forward" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
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

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 12,
  },

  // Contact Cards
  contactRow: {
    flexDirection: "row",
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: "center",
    ...shadows.small,
  },
  contactIcon: {
    marginBottom: 8,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  contactText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
  },

  // FAQ
  faqContainer: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
    marginTop: 12,
    marginLeft: 32,
  },

  // Message
  messageCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
  },
  messageInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.textDark,
    minHeight: 120,
    marginBottom: 12,
  },
  sendButton: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  sendGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  sendText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  // Resources Grid
  resourcesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  resourceCardNew: {
    width: "48%",
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.large,
  },
  resourceGradient: {
    padding: 20,
    minHeight: 160,
    justifyContent: "space-between",
  },
  resourceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resourceTitleNew: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  resourceDescNew: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
    marginBottom: 12,
  },
  resourceArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
});

export default HelpAndSupportScreen;

