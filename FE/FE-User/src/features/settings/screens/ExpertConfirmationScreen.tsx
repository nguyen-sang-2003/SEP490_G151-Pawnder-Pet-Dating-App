import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ExpertConfirmation">;

interface ExpertRequest {
  id: string;
  chatTitle: string;
  userQuestion: string;
  aiResponse: string;
  expertResponse?: string;
  status: "pending" | "answered" | "rejected";
  createdAt: Date;
  answeredAt?: Date;
  expertName?: string;
}

const ExpertConfirmationScreen = ({ navigation }: Props) => {
  // Mock data - in production: GET /expert-confirmation/{UserId}
  const [requests] = useState<ExpertRequest[]>([
    {
      id: "1",
      chatTitle: "Cat Nutrition Advice",
      userQuestion: "What should I feed my Persian cat daily?",
      aiResponse:
        "I recommend feeding your Persian cat high-quality protein-rich food 2-3 times daily. Persian cats particularly need food that supports their coat health with omega-3 fatty acids.",
      expertResponse:
        "The AI's advice is correct! Additionally, for Persian cats, I recommend wet food to prevent kidney issues and hairball control treats. Monitor their weight closely as Persians are prone to obesity.",
      status: "answered",
      createdAt: new Date(Date.now() - 172800000),
      answeredAt: new Date(Date.now() - 86400000),
      expertName: "Dr. Nguyen Van A",
    },
    {
      id: "2",
      chatTitle: "Vaccination Questions",
      userQuestion: "When should I vaccinate my 2-month-old kitten?",
      aiResponse:
        "Kittens should get their first shots at 6-8 weeks, with boosters at 12 and 16 weeks. Essential vaccines include FVRCP and rabies.",
      status: "pending",
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: "3",
      chatTitle: "Behavior Training",
      userQuestion: "How to stop my cat from scratching furniture?",
      aiResponse:
        "Provide scratching posts, use positive reinforcement, and try deterrent sprays on furniture.",
      expertResponse:
        "AI advice is good. Also ensure the scratching post is taller than the furniture and placed near the scratched areas. Trim nails regularly.",
      status: "answered",
      createdAt: new Date(Date.now() - 259200000),
      answeredAt: new Date(Date.now() - 172800000),
      expertName: "Dr. Tran Thi B",
    },
  ]);

  const getStatusColor = (status: ExpertRequest["status"]) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "answered":
        return "#4CAF50";
      case "rejected":
        return "#E94D6B";
      default:
        return colors.textMedium;
    }
  };

  const getStatusIcon = (status: ExpertRequest["status"]) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "answered":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getStatusLabel = (status: ExpertRequest["status"]) => {
    switch (status) {
      case "pending":
        return "Awaiting Expert";
      case "answered":
        return "Expert Confirmed";
      case "rejected":
        return "Declined";
      default:
        return status;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      return diffHours === 0 ? "Just now" : `${diffHours}h ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderRequest = ({ item }: { item: ExpertRequest }) => (
    <View style={styles.requestCard}>
      {/* Header */}
      <View style={styles.requestHeader}>
        <View style={styles.statusBadge}>
          <Icon
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
        <Text style={styles.requestTime}>{formatTime(item.createdAt)}</Text>
      </View>

      {/* Chat Info */}
      <View style={styles.chatInfo}>
        <Icon name="chatbubbles-outline" size={18} color="#9C27B0" />
        <Text style={styles.chatTitle}>{item.chatTitle}</Text>
      </View>

      {/* User Question */}
      <View style={styles.questionBox}>
        <View style={styles.questionHeader}>
          <Icon name="person-circle" size={16} color={colors.primary} />
          <Text style={styles.questionLabel}>Your Question:</Text>
        </View>
        <Text style={styles.questionText}>{item.userQuestion}</Text>
      </View>

      {/* AI Response */}
      <View style={styles.aiResponseBox}>
        <View style={styles.aiResponseHeader}>
          <Icon name="sparkles" size={16} color="#9C27B0" />
          <Text style={styles.aiResponseLabel}>AI's Answer:</Text>
        </View>
        <Text style={styles.aiResponseText}>{item.aiResponse}</Text>
      </View>

      {/* Expert Response */}
      {item.status === "answered" && item.expertResponse && (
        <View style={styles.expertResponseBox}>
          <View style={styles.expertResponseHeader}>
            <Icon name="shield-checkmark" size={18} color="#4CAF50" />
            <Text style={styles.expertResponseLabel}>
              Expert Confirmation
              {item.expertName && ` by ${item.expertName}`}
            </Text>
          </View>
          <Text style={styles.expertResponseText}>{item.expertResponse}</Text>
          {item.answeredAt && (
            <Text style={styles.expertResponseTime}>
              {formatTime(item.answeredAt)}
            </Text>
          )}
        </View>
      )}

      {/* Pending Status */}
      {item.status === "pending" && (
        <View style={styles.pendingBox}>
          <Icon name="hourglass-outline" size={20} color="#FF9800" />
          <Text style={styles.pendingText}>
            Waiting for expert review. You'll get a notification once answered.
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="shield-checkmark-outline" size={80} color={colors.textLabel} />
      <Text style={styles.emptyTitle}>No Expert Requests</Text>
      <Text style={styles.emptyText}>
        When you need expert confirmation on AI advice, your requests will appear here
      </Text>
    </View>
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const answeredCount = requests.filter((r) => r.status === "answered").length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.background} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expert Confirmations</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        {requests.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Icon name="shield-checkmark" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{answeredCount}</Text>
              <Text style={styles.statLabel}>Answered</Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="hourglass" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="documents" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{requests.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        )}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="information-circle" size={20} color="#4CAF50" />
          <Text style={styles.infoBannerText}>
            Our certified pet experts review AI responses to ensure accuracy
          </Text>
        </View>

        {/* Requests List */}
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
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

  // Stats
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    ...shadows.small,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMedium,
    marginTop: 2,
  },

  // Info Banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#4CAF50",
    lineHeight: 18,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Request Card
  requestCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    ...shadows.medium,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.cardBackgroundLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  requestTime: {
    fontSize: 12,
    color: colors.textMedium,
  },

  // Chat Info
  chatInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9C27B0",
  },

  // Question Box
  questionBox: {
    backgroundColor: colors.primaryPastel,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  questionText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },

  // AI Response Box
  aiResponseBox: {
    backgroundColor: colors.purplePastel,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#9C27B0",
  },
  aiResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  aiResponseLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9C27B0",
  },
  aiResponseText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },

  // Expert Response Box
  expertResponseBox: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  expertResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  expertResponseLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },
  expertResponseText: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
    marginBottom: 8,
  },
  expertResponseTime: {
    fontSize: 11,
    color: colors.textMedium,
    textAlign: "right",
  },

  // Pending Box
  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    color: "#F57C00",
    lineHeight: 18,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
});

export default ExpertConfirmationScreen;

