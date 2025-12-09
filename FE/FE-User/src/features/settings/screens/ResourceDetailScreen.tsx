import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ResourceDetail">;

// Content cho từng loại resource
const resourceContent = {
  terms: {
    title: "Terms of Service",
    icon: "document-text",
    gradient: ["#FF6EA7", "#FF9BC0"],
    sections: [
      {
        title: "1. Acceptance of Terms",
        content:
          "By accessing and using Pawnder, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
      },
      {
        title: "2. Use License",
        content:
          "Permission is granted to temporarily use Pawnder for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.",
      },
      {
        title: "3. User Accounts",
        content:
          "When you create an account with us, you must provide accurate, complete information. You are responsible for safeguarding the password and for all activities that occur under your account.",
      },
      {
        title: "4. Cat Profile Guidelines",
        content:
          "All cat profiles must contain accurate information. Misrepresentation of your cat's age, breed, or health status is prohibited. Photos must be of your actual cat.",
      },
      {
        title: "5. Prohibited Uses",
        content:
          "You may not use Pawnder for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction.",
      },
      {
        title: "6. Termination",
        content:
          "We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: "shield-checkmark",
    gradient: ["#9C27B0", "#BA68C8"],
    sections: [
      {
        title: "1. Information We Collect",
        content:
          "We collect information you provide directly to us, including your name, email address, phone number, and your cat's information (name, breed, age, photos, personality traits).",
      },
      {
        title: "2. How We Use Your Information",
        content:
          "We use the information to provide, maintain, and improve our services, to communicate with you, and to match you with other cat owners.",
      },
      {
        title: "3. Information Sharing",
        content:
          "We do not sell your personal information. We may share your information with other users for matching purposes and with service providers who assist us in operating our platform.",
      },
      {
        title: "4. Data Security",
        content:
          "We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.",
      },
      {
        title: "5. Your Rights",
        content:
          "You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.",
      },
      {
        title: "6. Cookies and Tracking",
        content:
          "We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve user experience.",
      },
    ],
  },
  community: {
    title: "Community Guidelines",
    icon: "people",
    gradient: ["#FF9800", "#FFB74D"],
    sections: [
      {
        title: "1. Be Respectful",
        content:
          "Treat all community members with respect and kindness. Harassment, bullying, or discriminatory behavior will not be tolerated.",
      },
      {
        title: "2. Honest Representation",
        content:
          "Be honest about yourself and your cat. Misrepresentation undermines trust in our community and may result in account suspension.",
      },
      {
        title: "3. Appropriate Content",
        content:
          "All photos and content must be appropriate and relevant to cat dating. No explicit, violent, or offensive content is allowed.",
      },
      {
        title: "4. Safety First",
        content:
          "Always prioritize safety when arranging meetings. Meet in public places and inform someone you trust about your plans.",
      },
      {
        title: "5. Report Issues",
        content:
          "If you encounter inappropriate behavior, suspicious activity, or safety concerns, please report it immediately through our app.",
      },
      {
        title: "6. No Commercial Use",
        content:
          "Pawnder is for personal use only. Advertising, selling products, or promoting services is not permitted.",
      },
    ],
  },
  guide: {
    title: "User Guide",
    icon: "book",
    gradient: ["#4CAF50", "#81C784"],
    sections: [
      {
        title: "1. Getting Started",
        content:
          "Create your account, add your cat's profile with photos and information, and start exploring other cats in your area.",
      },
      {
        title: "2. Creating a Great Profile",
        content:
          "Use clear, recent photos of your cat. Write an engaging bio highlighting your cat's personality. Be honest about age, breed, and temperament.",
      },
      {
        title: "3. How Matching Works",
        content:
          "Swipe right to like a cat, left to pass. When both users like each other, it's a match! You can then start chatting and arrange playdates.",
      },
      {
        title: "4. Using Filters",
        content:
          "Set your preferences for breed, age range, and distance. Premium members get access to advanced filters.",
      },
      {
        title: "5. Messaging & Chat",
        content:
          "Once matched, you can chat in-app. You can also use AI chat for pet care advice and tips anytime.",
      },
      {
        title: "6. Premium Features",
        content:
          "Upgrade to Premium for unlimited likes, see who liked you, advanced filters, and priority support.",
      },
    ],
  },
  safety: {
    title: "Safety Tips",
    icon: "bulb",
    gradient: ["#2196F3", "#64B5F6"],
    sections: [
      {
        title: "1. Verify Profiles",
        content:
          "Take time to verify the authenticity of profiles before meeting. Look for complete profiles with multiple photos and detailed information.",
      },
      {
        title: "2. Public Meetings",
        content:
          "Always meet in public, well-lit places for the first few encounters. Cat parks or pet-friendly cafes are ideal locations.",
      },
      {
        title: "3. Tell Someone",
        content:
          "Inform a friend or family member about your meeting plans, including location, time, and who you're meeting.",
      },
      {
        title: "4. Trust Your Instincts",
        content:
          "If something feels off, trust your gut. You're never obligated to continue a conversation or meeting if you feel uncomfortable.",
      },
      {
        title: "5. Protect Personal Info",
        content:
          "Don't share sensitive information like your home address, financial details, or other personal data too early.",
      },
      {
        title: "6. Cat Safety",
        content:
          "Ensure both cats are vaccinated and healthy before arranging playdates. Start with supervised interactions in neutral territory.",
      },
    ],
  },
  about: {
    title: "About Pawnder",
    icon: "information-circle",
    gradient: ["#607D8B", "#90A4AE"],
    sections: [
      {
        title: "Our Mission",
        content:
          "Pawnder was created to help cat owners connect and find perfect playmates for their furry friends. We believe every cat deserves companionship and social interaction.",
      },
      {
        title: "Our Story",
        content:
          "Founded in 2024, Pawnder started as a simple idea: what if we could help cats make friends just like their owners? Today, we're proud to serve thousands of cat owners worldwide.",
      },
      {
        title: "Our Values",
        content:
          "Safety, authenticity, and community are at the heart of everything we do. We're committed to creating a positive, trustworthy environment for all cat lovers.",
      },
      {
        title: "Our Team",
        content:
          "We're a team of passionate cat lovers, developers, and designers working together to create the best cat dating experience possible.",
      },
      {
        title: "Contact Us",
        content:
          "Have questions or feedback? We'd love to hear from you!\n\nEmail: support@pawnder.com\nPhone: +84 999 999 999\nAddress: Ha Noi, Vietnam",
      },
      {
        title: "Version",
        content:
          "Pawnder v1.0.0\n© 2024 Pawnder. All rights reserved.\n\nMade with ❤️ for cats everywhere.",
      },
    ],
  },
};

const ResourceDetailScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { type } = route.params;
  const resource = resourceContent[type as keyof typeof resourceContent];

  // Map resource types to translation keys
  const getTitleTranslation = (resourceType: string): string => {
    const titleMap: Record<string, string> = {
      terms: t('settings.resources.termsOfService'),
      privacy: t('settings.resources.privacyPolicy'),
      community: t('settings.resources.communityGuidelines'),
      guide: t('settings.resources.userGuide'),
      safety: t('settings.resources.safetyTips'),
      about: t('settings.resources.aboutPawnder'),
    };
    return titleMap[resourceType] || resource?.title || '';
  };

  if (!resource) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={resource.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.iconBox}>
            <Icon name={resource.icon} size={40} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>{getTitleTranslation(type)}</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {resource.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    color: colors.textMedium,
    lineHeight: 24,
  },
});

export default ResourceDetailScreen;

