import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useTranslation } from "react-i18next";
import { colors, gradients, radius, shadows } from "../../../theme";

const { width, height } = Dimensions.get("window");

interface ReportMessageModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  userName: string;
}

// Move REPORT_REASONS outside component to prevent recreation
const REPORT_REASONS = [
  {
    id: "inappropriateContent",
    icon: "image-outline",
    titleKey: "report.modal.reasons.inappropriateContent.title",
    descriptionKey: "report.modal.reasons.inappropriateContent.description",
    color: "#FF6B9D",
  },
  {
    id: "spamScam",
    icon: "warning-outline",
    titleKey: "report.modal.reasons.spamScam.title",
    descriptionKey: "report.modal.reasons.spamScam.description",
    color: "#FFA726",
  },
  {
    id: "harassment",
    icon: "sad-outline",
    titleKey: "report.modal.reasons.harassment.title",
    descriptionKey: "report.modal.reasons.harassment.description",
    color: "#EF5350",
  },
  {
    id: "inappropriateMessages",
    icon: "chatbox-ellipses-outline",
    titleKey: "report.modal.reasons.inappropriateMessages.title",
    descriptionKey: "report.modal.reasons.inappropriateMessages.description",
    color: "#E91E63",
  },
  {
    id: "hateSpeech",
    icon: "alert-circle-outline",
    titleKey: "report.modal.reasons.hateSpeech.title",
    descriptionKey: "report.modal.reasons.hateSpeech.description",
    color: "#F44336",
  },
  {
    id: "violenceThreats",
    icon: "flash-outline",
    titleKey: "report.modal.reasons.violenceThreats.title",
    descriptionKey: "report.modal.reasons.violenceThreats.description",
    color: "#D32F2F",
  },
  {
    id: "fakeProfile",
    icon: "person-remove-outline",
    titleKey: "report.modal.reasons.fakeProfile.title",
    descriptionKey: "report.modal.reasons.fakeProfile.description",
    color: "#9C27B0",
  },
  {
    id: "underage",
    icon: "shield-outline",
    titleKey: "report.modal.reasons.underage.title",
    descriptionKey: "report.modal.reasons.underage.description",
    color: "#673AB7",
  },
  {
    id: "other",
    icon: "ellipsis-horizontal-circle-outline",
    titleKey: "report.modal.reasons.other.title",
    descriptionKey: "report.modal.reasons.other.description",
    color: "#757575",
  },
];

const ReportMessageModal: React.FC<ReportMessageModalProps> = React.memo(({
  visible,
  onClose,
  onSubmit,
  userName,
}) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");

  const handleReasonSelect = useCallback((reasonId: string) => {
    setSelectedReason(reasonId);
  }, []);

  const handleNext = useCallback(() => {
    if (!selectedReason) return;
    setStep("confirm");
  }, [selectedReason]);

  const handleBack = useCallback(() => {
    setStep("select");
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedReason) return;

    // Get the reason text
    const reason = REPORT_REASONS.find((r) => r.id === selectedReason);
    let finalReason = reason ? t(reason.titleKey) : "";

    // If "other" is selected, use the custom text
    if (selectedReason === "other" && otherReason.trim()) {
      finalReason = `${finalReason}: ${otherReason.trim()}`;
    }

    onSubmit(finalReason);

    // Reset state
    setSelectedReason(null);
    setOtherReason("");
    setStep("select");
  }, [selectedReason, otherReason, onSubmit, t]);

  const handleClose = useCallback(() => {
    setSelectedReason(null);
    setOtherReason("");
    setStep("select");
    onClose();
  }, [onClose]);

  const selectedReasonData = useMemo(() => 
    REPORT_REASONS.find((r) => r.id === selectedReason),
    [selectedReason]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            {step === "confirm" && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Icon name="arrow-back" size={24} color={colors.textDark} />
              </TouchableOpacity>
            )}
            <View style={styles.headerTitleContainer}>
              <Icon
                name="flag"
                size={24}
                color={colors.error}
                style={styles.headerIcon}
              />
              <Text style={styles.headerTitle}>
                {step === "select" ? t('report.modal.title') : t('report.modal.confirmTitle')}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {step === "select" ? (
            <>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.infoBox}>
                  <Icon
                    name="shield-checkmark-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.infoText}>
                    {t('report.modal.infoBanner')}
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>
                  {t('report.modal.selectReason', { name: userName })}
                </Text>

                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonOption,
                      selectedReason === reason.id &&
                        styles.reasonOptionSelected,
                    ]}
                    onPress={() => handleReasonSelect(reason.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.reasonIconContainer,
                        { backgroundColor: reason.color + "20" },
                      ]}
                    >
                      <Icon
                        name={reason.icon}
                        size={22}
                        color={reason.color}
                      />
                    </View>
                    <View style={styles.reasonTextContainer}>
                      <Text style={styles.reasonTitle}>{t(reason.titleKey)}</Text>
                      <Text style={styles.reasonDescription}>
                        {t(reason.descriptionKey)}
                      </Text>
                    </View>
                    <View style={styles.radioButton}>
                      {selectedReason === reason.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Other reason input */}
                {selectedReason === "other" && (
                  <View style={styles.otherReasonContainer}>
                    <Text style={styles.otherReasonLabel}>
                      {t('report.modal.otherReasonLabel')}
                    </Text>
                    <TextInput
                      style={styles.otherReasonInput}
                      placeholder={t('report.modal.otherReasonPlaceholder')}
                      placeholderTextColor={colors.textLabel}
                      value={otherReason}
                      onChangeText={setOtherReason}
                      multiline
                      maxLength={500}
                      textAlignVertical="top"
                    />
                    <Text style={styles.characterCount}>
                      {otherReason.length}/500
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Next Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    !selectedReason && styles.nextButtonDisabled,
                    selectedReason === "other" &&
                      !otherReason.trim() &&
                      styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={
                    !selectedReason ||
                    (selectedReason === "other" && !otherReason.trim())
                  }
                >
                  <LinearGradient
                    colors={
                      selectedReason &&
                      (selectedReason !== "other" || otherReason.trim())
                        ? [colors.error, "#D32F2F"]
                        : ["#E0E0E0", "#BDBDBD"]
                    }
                    style={styles.nextButtonGradient}
                  >
                    <Text style={styles.nextButtonText}>{t('report.modal.nextButton')}</Text>
                    <Icon name="arrow-forward" size={20} color={colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Confirmation Step */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.confirmContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.confirmBox}>
                  <Icon
                    name="alert-circle"
                    size={56}
                    color={colors.error}
                    style={styles.confirmIcon}
                  />
                  <Text style={styles.confirmTitle}>
                    {t('report.modal.confirmTitle')}
                  </Text>
                  <Text style={styles.confirmMessage}>
                    {t('report.modal.confirmMessage')}{" "}
                    <Text style={styles.confirmUserName}>{userName}</Text>{" "}
                    {t('report.modal.confirmReason')}
                  </Text>

                  <View style={styles.selectedReasonBox}>
                    {selectedReasonData && (
                      <>
                        <View
                          style={[
                            styles.selectedReasonIcon,
                            {
                              backgroundColor:
                                selectedReasonData.color + "20",
                            },
                          ]}
                        >
                          <Icon
                            name={selectedReasonData.icon}
                            size={26}
                            color={selectedReasonData.color}
                          />
                        </View>
                        <Text style={styles.selectedReasonTitle}>
                          {t(selectedReasonData.titleKey)}
                        </Text>
                        {selectedReason === "other" && otherReason.trim() && (
                          <Text style={styles.selectedReasonDescription}>
                            "{otherReason.trim()}"
                          </Text>
                        )}
                      </>
                    )}
                  </View>

                  <View style={styles.warningBox}>
                    <Icon name="shield-outline" size={18} color="#FFA726" />
                    <Text style={styles.warningText}>
                      {t('report.modal.warningMessage', { name: userName })}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Confirm Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleBack}
                >
                  <Text style={styles.cancelButtonText}>{t('report.modal.backButton')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleSubmit}
                >
                  <LinearGradient
                    colors={[colors.error, "#D32F2F"]}
                    style={styles.confirmButtonGradient}
                  >
                    <Icon name="flag" size={20} color={colors.white} />
                    <Text style={styles.confirmButtonText}>{t('report.modal.submitButton')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.xl,
    width: width * 0.9,
    maxWidth: 500,
    maxHeight: height * 0.9,
    paddingBottom: 20,
    overflow: "hidden",
    ...shadows.large,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 12,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 12,
  },

  // Content
  scrollView: {
    maxHeight: height * 0.65,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },

  // Info Box
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textDark,
    lineHeight: 16,
    marginLeft: 8,
  },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 12,
  },

  // Reason Options
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  reasonOptionSelected: {
    borderColor: colors.error,
    backgroundColor: "#FFEBEE",
  },
  reasonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  reasonTextContainer: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 1,
  },
  reasonDescription: {
    fontSize: 12,
    color: colors.textMedium,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textLabel,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
  },

  // Other Reason Input
  otherReasonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  otherReasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 8,
  },
  otherReasonInput: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: colors.textDark,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textLabel,
    textAlign: "right",
    marginTop: 4,
  },

  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  nextButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.white,
  },

  // Confirmation Step
  confirmContent: {
    padding: 16,
  },
  confirmBox: {
    alignItems: "center",
  },
  confirmIcon: {
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 8,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  confirmUserName: {
    fontWeight: "bold",
    color: colors.textDark,
  },

  // Selected Reason Box
  selectedReasonBox: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    ...shadows.medium,
  },
  selectedReasonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  selectedReasonTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 6,
    textAlign: "center",
  },
  selectedReasonDescription: {
    fontSize: 13,
    color: colors.textMedium,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
  },

  // Warning Box
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FFF8E1",
    borderRadius: radius.md,
    padding: 10,
    alignItems: "flex-start",
    width: "100%",
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.textDark,
    lineHeight: 16,
    marginLeft: 8,
  },

  // Confirm Buttons
  cancelButton: {
    flex: 1,
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: radius.lg,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  confirmButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  confirmButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.white,
  },
});

export default ReportMessageModal;
