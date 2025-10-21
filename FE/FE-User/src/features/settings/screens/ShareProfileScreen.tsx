import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ShareProfile">;

const ShareProfileScreen = ({ navigation }: Props) => {
  const profileUrl = "https://pawnder.app/cat/luna-12345";
  const catName = "Luna";

  const handleShare = async (platform: string) => {
    try {
      const message = `Check out ${catName}'s profile on Pawnder! 🐱\n${profileUrl}`;
      
      const result = await Share.share({
        message: message,
        url: profileUrl,
        title: `${catName} on Pawnder`,
      });

      if (result.action === Share.sharedAction) {
        console.log("Shared to:", platform);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = () => {
    // In real app, use Clipboard.setString(profileUrl)
    Alert.alert("Link Copied!", "Profile link copied to clipboard");
  };

  const handleDownloadQR = () => {
    Alert.alert("QR Code", "QR code will be saved to your gallery");
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
        <Text style={styles.headerTitle}>Share Cat Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Preview */}
        <View style={styles.section}>
          <View style={styles.previewCard}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.previewGradient}
            >
              <Icon name="paw" size={60} color="#fff" />
              <Text style={styles.previewName}>{catName}</Text>
              <Text style={styles.previewDesc}>Persian Cat • 2 years</Text>
            </LinearGradient>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <View style={styles.qrCard}>
            <View style={styles.qrPlaceholder}>
              <Icon name="qr-code" size={120} color={colors.primary} />
            </View>
            <Text style={styles.qrText}>Scan to view profile</Text>
            <TouchableOpacity
              style={styles.downloadQrBtn}
              onPress={handleDownloadQR}
            >
              <Icon name="download-outline" size={20} color={colors.primary} />
              <Text style={styles.downloadQrText}>Download QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Link */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Link</Text>
          <View style={styles.linkCard}>
            <View style={styles.linkBox}>
              <Icon name="link-outline" size={20} color={colors.textMedium} />
              <Text style={styles.linkText} numberOfLines={1}>
                {profileUrl}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopyLink}
            >
              <LinearGradient
                colors={gradients.primary}
                style={styles.copyGradient}
              >
                <Icon name="copy" size={18} color="#fff" />
                <Text style={styles.copyText}>Copy</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share via */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share via</Text>

          <View style={styles.shareGrid}>
            <TouchableOpacity
              style={styles.shareCard}
              onPress={() => handleShare("WhatsApp")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#25D366" }]}>
                <Icon name="logo-whatsapp" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCard}
              onPress={() => handleShare("Facebook")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#1877F2" }]}>
                <Icon name="logo-facebook" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCard}
              onPress={() => handleShare("Instagram")}
            >
              <View
                style={[
                  styles.shareIcon,
                  { backgroundColor: "#E4405F" },
                ]}
              >
                <Icon name="logo-instagram" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCard}
              onPress={() => handleShare("Twitter")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#1DA1F2" }]}>
                <Icon name="logo-twitter" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCard}
              onPress={() => handleShare("Telegram")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#0088cc" }]}>
                <Icon name="paper-plane" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>Telegram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCard}
              onPress={() => handleShare("Email")}
            >
              <View style={[styles.shareIcon, { backgroundColor: "#EA4335" }]}>
                <Icon name="mail" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCard}
              onPress={() => handleShare("SMS")}
            >
              <View
                style={[
                  styles.shareIcon,
                  { backgroundColor: "#9C27B0" },
                ]}
              >
                <Icon name="chatbubble" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareCard}
              onPress={() => handleShare("More")}
            >
              <View
                style={[
                  styles.shareIcon,
                  { backgroundColor: colors.textMedium },
                ]}
              >
                <Icon name="ellipsis-horizontal" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.section}>
          <View style={styles.noteCard}>
            <Icon name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.noteText}>
              Anyone with this link can view your cat's profile. Only share
              with people you trust!
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  // Preview Card
  previewCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.large,
  },
  previewGradient: {
    padding: 32,
    alignItems: "center",
  },
  previewName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  previewDesc: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  // QR Code
  qrCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: "center",
    ...shadows.small,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  qrText: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 16,
  },
  downloadQrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  downloadQrText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },

  // Link
  linkCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
  },
  copyBtn: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  copyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  copyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // Share Grid
  shareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  shareCard: {
    width: "22%",
    alignItems: "center",
  },
  shareIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    ...shadows.medium,
  },
  shareLabel: {
    fontSize: 12,
    color: colors.textDark,
    textAlign: "center",
  },

  // Note
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
});

export default ShareProfileScreen;

