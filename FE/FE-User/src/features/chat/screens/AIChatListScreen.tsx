import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getChatAISessions, createChatAISession, deleteChatAISession, updateChatAITitle, ChatAISession } from "../../../api";

type Props = NativeStackScreenProps<RootStackParamList, "AIChatList">;

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

const AIChatListScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [newTitle, setNewTitle] = useState("");

  // Load chat sessions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChatSessions();
    }, [])
  );

  const loadChatSessions = async () => {
    try {
      setLoading(true);
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setLoading(false);
        return;
      }

      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);

      const sessions = await getChatAISessions(userId);

      // Convert API data to ChatSession format
      const formattedSessions: ChatSession[] = sessions.map((session: ChatAISession) => {
        // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
        let dateString = session.updatedAt;
        if (!dateString.endsWith('Z') && !dateString.includes('+')) {
          dateString = dateString + 'Z';
        }

        return {
          id: session.chatAiid.toString(),
          title: session.title,
          lastMessage: session.lastQuestion || '',
          timestamp: new Date(dateString),
          messageCount: session.messageCount,
        };
      });

      setChatSessions(formattedSessions);
    } catch (error: any) {
      // Silent fail - just show empty state
      setChatSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewChat = async () => {
    if (!currentUserId) {
      Alert.alert(t('common.error'), t('chat.aiList.userNotFound'));
      return;
    }

    try {
      const newChat = await createChatAISession(currentUserId, { title: 'New Chat' });

      // Navigate to chat screen immediately
      navigation.navigate("AIChat", { chatId: newChat.chatId.toString() });

      // Reload list when we come back
      loadChatSessions();
    } catch (error: any) {
      // Show user-friendly alert (401 already handled by interceptor)
      if (error.response?.status !== 401) {
        Alert.alert(
          t('chat.aiList.createError'),
          error.message || t('chat.aiList.createErrorMessage'),
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleChatPress = (chatId: string) => {
    navigation.navigate("AIChat", { chatId });
  };

  const handleRenameChat = (chat: ChatSession) => {
    setSelectedChat(chat);
    setNewTitle(chat.title);
    setShowRenameModal(true);
  };

  const handleSaveRename = async () => {
    // Validation: Kiểm tra tên trống
    if (!selectedChat || !newTitle.trim()) {
      Alert.alert(t('auth.signUp.missingInfo'), t('chat.aiList.renameEmpty'));
      return;
    }

    // Validation: Kiểm tra độ dài tên
    if (newTitle.trim().length < 2) {
      Alert.alert(t('auth.addPet.basicInfo.invalidName'), t('chat.aiList.renameMinLength'));
      return;
    }

    try {
      await updateChatAITitle(parseInt(selectedChat.id), newTitle.trim());
      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === selectedChat.id ? { ...chat, title: newTitle.trim() } : chat
        )
      );
      setShowRenameModal(false);
      setSelectedChat(null);
      setNewTitle("");
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('chat.aiList.renameError'));
    }
  };

  const handleDeleteChat = (chatId: string, title: string) => {
    Alert.alert(
      t('chat.aiList.deleteTitle'),
      t('chat.aiList.deleteMessage', { title }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChatAISession(parseInt(chatId));
              setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
            } catch (error: any) {

              Alert.alert(t('common.error'), error.message || t('chat.aiList.deleteError'));
            }
          },
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    
    if (diffTime < 60000) {
      return t('chat.aiList.timeAgo.justNow');
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffTime / (1000 * 60));
        return t('chat.aiList.timeAgo.minutes', { count: diffMins });
      }
      return t('chat.aiList.timeAgo.hours', { count: diffHours });
    }
    if (diffDays === 1) return t('chat.aiList.timeAgo.yesterday');
    if (diffDays < 7) return t('chat.aiList.timeAgo.days', { count: diffDays });
    return date.toLocaleDateString();
  };

  const renderChatSession = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item.id)}
      onLongPress={() => handleRenameChat(item)}
    >
      <View style={styles.chatIconContainer}>
        <LinearGradient
          colors={gradients.ai}
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
          {item.lastMessage || t('chat.aiList.startChat')}
        </Text>
        <Text style={styles.chatMessageCount}>
          {t('chat.aiList.messageCount', { count: item.messageCount })}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteChat(item.id, item.title)}
      >
        <LinearGradient
          colors={["#FF6B6B", "#FF8E8E"]}
          style={styles.deleteIconGradient}
        >
          <Icon name="trash-outline" size={16} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradients.background} style={styles.gradient}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.textDark} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <LinearGradient
                colors={gradients.ai}
                style={styles.headerIcon}
              >
                <Icon name="sparkles" size={24} color={colors.white} />
              </LinearGradient>
              <Text style={styles.headerTitle}>{t('chat.ai.listTitle')}</Text>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.aiPrimary} />
            <Text style={styles.loadingText}>{t('chat.ai.loading')}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

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
              colors={gradients.ai}
              style={styles.headerIcon}
            >
              <Icon name="sparkles" size={24} color={colors.white} />
            </LinearGradient>
            <Text style={styles.headerTitle}>{t('chat.ai.listTitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.expertButton}
            onPress={() => navigation.navigate("ExpertConfirmation" as any)}
          >
            <LinearGradient
              colors={["#4CAF50", "#81C784"]}
              style={styles.expertIconGradient}
            >
              <Icon name="shield-checkmark" size={20} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <LinearGradient
            colors={gradients.ai}
            style={styles.infoBannerIconGradient}
          >
            <Icon name="information-circle" size={18} color={colors.white} />
          </LinearGradient>
          <Text style={styles.infoBannerText}>
            {t('chat.aiList.infoBanner')}
          </Text>
        </View>

        {/* New Chat Button */}
        <TouchableOpacity style={styles.newChatButton} onPress={handleCreateNewChat}>
          <LinearGradient
            colors={gradients.ai}
            style={styles.newChatGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="add-circle-outline" size={24} color={colors.white} />
            <Text style={styles.newChatText}>{t('chat.aiList.newChat')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Chat Sessions List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t('chat.aiList.yourChats')}</Text>
          <Text style={styles.listSubtitle}>
            {t('chat.aiList.chatCount', { count: chatSessions.length })}
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
            <LinearGradient
              colors={gradients.ai}
              style={styles.emptyIconGradient}
            >
              <Icon name="chatbubbles-outline" size={60} color={colors.white} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>{t('chat.aiList.noChats')}</Text>
            <Text style={styles.emptyText}>
              {t('chat.aiList.noChatsDesc')}
            </Text>
          </View>
        )}

        {/* Rename Modal */}
        <Modal
          visible={showRenameModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRenameModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowRenameModal(false)}
          >
            <Pressable style={styles.renameModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Icon name="create-outline" size={24} color={colors.aiPrimary} />
                <Text style={styles.modalTitle}>{t('chat.aiList.renameTitle')}</Text>
              </View>

              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder={t('chat.aiList.renamePlaceholder')}
                placeholderTextColor={colors.textLabel}
                autoFocus
                maxLength={50}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowRenameModal(false)}
                >
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleSaveRename}
                  disabled={!newTitle.trim()}
                >
                  <LinearGradient
                    colors={newTitle.trim() ? gradients.ai : ["#E0E0E0", "#BDBDBD"]}
                    style={styles.modalSaveGradient}
                  >
                    <Text style={styles.modalSaveText}>{t('common.save')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
  },
  expertButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  expertIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },

  // Info Banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: "rgba(255, 154, 118, 0.2)",
    ...shadows.small,
  },
  infoBannerIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.aiPrimary,
    lineHeight: 18,
  },

  // New Chat Button
  newChatButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.large,
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
    color: colors.aiPrimary,
    fontWeight: "500",
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // Rename Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  renameModal: {
    width: "85%",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 24,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
  modalInput: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.textDark,
    borderWidth: 2,
    borderColor: "rgba(255, 154, 118, 0.2)",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    minWidth: 80,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMedium,
    textAlign: "center",
    paddingVertical: 10,
  },
  modalSaveGradient: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
    fontWeight: '600',
  },
});

export default AIChatListScreen;

