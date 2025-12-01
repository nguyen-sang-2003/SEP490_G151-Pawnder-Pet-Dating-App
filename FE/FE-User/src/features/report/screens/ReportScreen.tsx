import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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

type Props = NativeStackScreenProps<RootStackParamList, "Report">;

interface ReportReason {
  id: string;
  labelKey: string;
  icon: string;
}

const REPORT_REASONS: ReportReason[] = [
  { id: "spam", labelKey: "report.reasons.spam", icon: "megaphone-outline" },
  { id: "inappropriate", labelKey: "report.reasons.inappropriate", icon: "warning-outline" },
  { id: "fake", labelKey: "report.reasons.fake", icon: "person-remove-outline" },
  { id: "harassment", labelKey: "report.reasons.harassment", icon: "sad-outline" },
  { id: "scam", labelKey: "report.reasons.scam", icon: "shield-outline" },
  { id: "other", labelKey: "report.reasons.other", icon: "ellipsis-horizontal-outline" },
];

const ReportScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { userId, userName } = route.params || {};
  
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const handleSubmit = async () => {
    // Validation: Kiểm tra đã chọn lý do
    if (!selectedReason) {
      showAlert({ type: 'warning', title: t('report.validation.missingInfo'), message: t('report.validation.selectReason') });
      return;
    }

    // Validation: Kiểm tra mô tả trống
    if (!description.trim()) {
      showAlert({ type: 'warning', title: t('report.validation.missingInfo'), message: t('report.validation.provideDetails') });
      return;
    }

    // Validation: Kiểm tra độ dài mô tả
    if (description.trim().length < 10) {
      showAlert({ type: 'error', title: t('report.validation.descriptionTooShort'), message: t('report.validation.minCharacters') });
      return;
    }

    setIsSubmitting(true);

    // TODO: Call Report API - POST /report/{UserReportId}/{ContentId}
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      showAlert({
        type: 'success',
        title: t('report.success.title'),
        message: t('report.success.message'),
        onClose: () => navigation.goBack(),
      });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.background}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="close" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('report.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Info */}
          <View style={styles.userInfo}>
            <Icon name="flag" size={48} color="#FF9800" />
            <Text style={styles.userInfoTitle}>
              {t('report.reportUser', { name: userName || t('common.noData') })}
            </Text>
            <Text style={styles.userInfoSubtitle}>
              {t('report.reportSubtitle')}
            </Text>
          </View>

          {/* Report Reasons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('report.whyReport')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('report.selectReason')}
            </Text>

            <View style={styles.reasonsList}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonCard,
                    selectedReason === reason.id && styles.reasonCardActive,
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <View style={styles.reasonLeft}>
                    <View
                      style={[
                        styles.reasonIcon,
                        selectedReason === reason.id && styles.reasonIconActive,
                      ]}
                    >
                      <Icon
                        name={reason.icon}
                        size={24}
                        color={
                          selectedReason === reason.id
                            ? colors.white
                            : "#FF9800"
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        selectedReason === reason.id && styles.reasonTextActive,
                      ]}
                    >
                      {t(reason.labelKey)}
                    </Text>
                  </View>
                  {selectedReason === reason.id && (
                    <Icon name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('report.additionalDetails')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('report.provideMoreInfo')}
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('report.descriptionPlaceholder')}
                placeholderTextColor={colors.textLabel}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {description.length}/500
              </Text>
            </View>
          </View>

          {/* Safety Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Icon name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={styles.tipsTitle}>{t('report.safetyTips')}</Text>
            </View>
            <Text style={styles.tipsText}>
              {t('report.safetyTipsContent')}
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Submit Button - Fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting || !selectedReason || !description.trim()}
          >
            <LinearGradient
              colors={
                isSubmitting || !selectedReason || !description.trim()
                  ? ["#DDD", "#CCC"]
                  : ["#FF9800", "#FFB74D"]
              }
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <Text style={styles.submitText}>{t('report.submitting')}</Text>
              ) : (
                <>
                  <Icon name="flag" size={20} color={colors.white} />
                  <Text style={styles.submitText}>{t('report.submitButton')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
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
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // User Info
  userInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  userInfoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 12,
  },
  userInfoSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 16,
  },

  // Reasons List
  reasonsList: {
    gap: 12,
  },
  reasonCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.whiteWarm,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  reasonCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPastel,
  },
  reasonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  reasonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  reasonIconActive: {
    backgroundColor: "#FF9800",
  },
  reasonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
    flex: 1,
  },
  reasonTextActive: {
    color: colors.primary,
  },

  // Input
  inputContainer: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    padding: 16,
    ...shadows.small,
  },
  input: {
    fontSize: 15,
    color: colors.textDark,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: "right",
    marginTop: 8,
  },

  // Safety Tips
  tipsCard: {
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryPastel,
    ...shadows.small,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  tipsText: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 22,
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  submitButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.button,
  },
  submitGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});

export default ReportScreen;

