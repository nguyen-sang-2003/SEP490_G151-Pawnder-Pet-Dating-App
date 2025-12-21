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
import { useTranslation } from "react-i18next";
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
    question: "How do I create a cat profile?",
    answer:
      "After signing up, you'll be prompted to add your cat's information including name, breed, age, and photos. You can also add personality traits to help find better matches!",
  },
  {
    id: "2",
    question: "What does 'Match' mean?",
    answer:
      "A match happens when both you and another user like each other's cats. Once matched, you can start chatting and arrange playdates!",
  },
  {
    id: "3",
    question: "How do I report inappropriate behavior?",
    answer:
      "Go to the user's profile, tap the menu button, and select 'Report'. You can also access this from Privacy & Safety settings.",
  },
  {
    id: "4",
    question: "Can I change my cat's information?",
    answer:
      "Yes! Go to your Profile, tap on your cat's card, and you can edit all information including photos, age, and personality traits.",
  },
  {
    id: "5",
    question: "What is Premium membership?",
    answer:
      "Premium members get unlimited likes, can see who liked them, get priority support, and unlock exclusive filters!",
  },
];

const HelpAndSupportScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage("");
      showAlert({ type: 'success', title: t('common.success'), message: t('settings.helpAndSupport.messageSent') });
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
        <Text style={styles.headerTitle}>{t('settings.helpAndSupport.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.helpAndSupport.contactUs')}</Text>

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
              <Text style={styles.contactText}>{t('settings.helpAndSupport.email')}</Text>
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
              <Text style={styles.contactText}>{t('settings.helpAndSupport.call')}</Text>
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
              <Text style={styles.contactText}>{t('settings.helpAndSupport.liveChat')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.helpAndSupport.faq')}</Text>

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
          <Text style={styles.sectionTitle}>{t('settings.helpAndSupport.sendMessage')}</Text>

          <View style={styles.messageCard}>
            <TextInput
              style={styles.messageInput}
              placeholder={t('settings.helpAndSupport.messagePlaceholder')}
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
                <Text style={styles.sendText}>{t('settings.helpAndSupport.sendButton')}</Text>
                <Icon name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.helpAndSupport.resources')}</Text>

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
                <Text style={styles.resourceTitleNew}>{t('settings.resources.termsOfService')}</Text>
                <Text style={styles.resourceDescNew}>
                  {t('settings.resources.termsDesc')}
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
                <Text style={styles.resourceTitleNew}>{t('settings.resources.privacyPolicy')}</Text>
                <Text style={styles.resourceDescNew}>
                  {t('settings.resources.privacyDesc')}
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
                <Text style={styles.resourceTitleNew}>{t('settings.resources.communityGuidelines')}</Text>
                <Text style={styles.resourceDescNew}>
                  {t('settings.resources.communityDesc')}
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
                <Text style={styles.resourceTitleNew}>{t('settings.resources.userGuide')}</Text>
                <Text style={styles.resourceDescNew}>
                  {t('settings.resources.userGuideDesc')}
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
                <Text style={styles.resourceTitleNew}>{t('settings.resources.safetyTips')}</Text>
                <Text style={styles.resourceDescNew}>
                  {t('settings.resources.safetyDesc')}
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
                <Text style={styles.resourceTitleNew}>{t('settings.resources.aboutPawnder')}</Text>
                <Text style={styles.resourceDescNew}>
                  {t('settings.resources.aboutDesc')}
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

