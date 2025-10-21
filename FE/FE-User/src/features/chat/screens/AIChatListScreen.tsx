import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "AIChatList">;

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

const AIChatListScreen = ({ navigation }: Props) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Cat Nutrition Advice",
      lastMessage: "What should I feed my Persian cat?",
      timestamp: new Date(Date.now() - 3600000),
      messageCount: 5,
    },
    {
      id: "2",
      title: "Health Checkup Questions",
      lastMessage: "Is my cat's behavior normal?",
      timestamp: new Date(Date.now() - 86400000),
      messageCount: 8,
    },
    {
      id: "3",
      title: "Training Tips",
      lastMessage: "How to train my cat?",
      timestamp: new Date(Date.now() - 172800000),
      messageCount: 3,
    },
  ]);

  const handleCreateNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      lastMessage: "",
      timestamp: new Date(),
      messageCount: 0,
    };
    
    setChatSessions(prev => [newChat, ...prev]);
    navigation.navigate("AIChat", { chatId: newChat.id });
  };

  const handleChatPress = (chatId: string) => {
    navigation.navigate("AIChat", { chatId });
  };

  const handleDeleteChat = (chatId: string, title: string) => {
    Alert.alert(
      "Delete Conversation",
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
            // TODO: Call DELETE /chat-ai/{chatAiId}
          },
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffTime / (1000 * 60));
        return `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderChatSession = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item.id)}
      onLongPress={() => handleDeleteChat(item.id, item.title)}
    >
      <View style={styles.chatIconContainer}>
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          style={styles.chatIconGradient}
        >
          <Icon name="chatbubbles" size={20} color={colors.white} />
        </LinearGradient>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.chatTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.chatLastMessage} numberOfLines={1}>
          {item.lastMessage || "Start a conversation..."}
        </Text>
        <Text style={styles.chatMessageCount}>
          {item.messageCount} message{item.messageCount !== 1 ? "s" : ""}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteChat(item.id, item.title)}
      >
        <Icon name="trash-outline" size={18} color={colors.textMedium} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
          <View style={styles.headerCenter}>
            <LinearGradient
              colors={["#667EEA", "#764BA2"]}
              style={styles.headerIcon}
            >
              <Icon name="sparkles" size={24} color={colors.white} />
            </LinearGradient>
            <Text style={styles.headerTitle}>AI Assistant</Text>
          </View>
          <TouchableOpacity
            style={styles.expertButton}
            onPress={() => navigation.navigate("ExpertConfirmation" as any)}
          >
            <Icon name="shield-checkmark" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="information-circle" size={20} color="#667EEA" />
          <Text style={styles.infoBannerText}>
            Get instant pet care advice. Ask an expert for confirmation!
          </Text>
        </View>

        {/* New Chat Button */}
        <TouchableOpacity style={styles.newChatButton} onPress={handleCreateNewChat}>
          <LinearGradient
            colors={["#667EEA", "#764BA2"]}
            style={styles.newChatGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="add-circle-outline" size={24} color={colors.white} />
            <Text style={styles.newChatText}>New Conversation</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Chat Sessions List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Your Conversations</Text>
          <Text style={styles.listSubtitle}>
            {chatSessions.length} conversation{chatSessions.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {chatSessions.length > 0 ? (
          <FlatList
            data={chatSessions}
            renderItem={renderChatSession}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={80} color={colors.textLabel} />
            <Text style={styles.emptyTitle}>No Conversations Yet</Text>
            <Text style={styles.emptyText}>
              Start a new conversation to get pet care advice from AI
            </Text>
          </View>
        )}
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
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
  },
  expertButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },

  // Info Banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.25)",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#667EEA",
    lineHeight: 18,
  },

  // New Chat Button
  newChatButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  newChatGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  newChatText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },

  // List Header
  listHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
  },
  listSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Chat Item
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 10,
    ...shadows.small,
  },
  chatIconContainer: {
    marginRight: 12,
  },
  chatIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: colors.textMedium,
    marginLeft: 8,
  },
  chatLastMessage: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 4,
  },
  chatMessageCount: {
    fontSize: 12,
    color: "#667EEA",
    fontWeight: "500",
  },
  deleteBtn: {
    padding: 8,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
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

export default AIChatListScreen;

