import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, radius, shadows } from "../../../theme";
import { getExpertChatMessages, sendExpertChatMessage, ExpertChatMessage } from "../api/expertChatApi";
import signalRService from "../../../services/signalr.service";
import { markExpertChatAsRead } from "../../badge/badgeSlice";
import { AppDispatch } from "../../../app/store";

type Props = NativeStackScreenProps<RootStackParamList, "ExpertChat">;

interface Message {
  id: string;
  text: string;
  isExpert: boolean;
  timestamp: Date;
  status?: "sending" | "sent" | "failed";
}

const ExpertChatScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { chatExpertId, expertId, expertName } = route.params || {};
  const dispatch = useDispatch<AppDispatch>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Mark chat as read when entering screen
  useEffect(() => {
    if (chatExpertId) {
      dispatch(markExpertChatAsRead(chatExpertId));
    }
  }, [chatExpertId, dispatch]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!chatExpertId) {

      Alert.alert(t('alerts.error'), t('expert.chat.errors.chatNotFound'));
      setLoading(false);
      return;
    }

    try {
      // Get current userId first
      const userIdStr = await AsyncStorage.getItem('userId');
      const userId = userIdStr ? parseInt(userIdStr) : null;
      setCurrentUserId(userId);

      if (!userId) {

        Alert.alert(t('alerts.error'), t('expert.chat.errors.userNotFound'));
        setLoading(false);
        return;
      }

      console.log(`🔄 Loading messages for chatExpertId: ${chatExpertId}`);
      const data = await getExpertChatMessages(chatExpertId);

      // Transform API messages to UI messages
      const transformedMessages: Message[] = data.map((msg: ExpertChatMessage) => {
        // Backend trả về UTC, cần thêm 'Z' nếu chưa có
        let dateStr = msg.createdAt;
        if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
          dateStr = dateStr + 'Z';
        }

        return {
          id: msg.contentId.toString(),
          text: msg.message,
          isExpert: msg.fromId !== userId, // If fromId is not current user, it's from expert
          timestamp: new Date(dateStr),
          status: "sent" as const,
        };
      });

      setMessages(transformedMessages);
      console.log('✅ Loaded', transformedMessages.length, 'messages');
    } catch (error: any) {

      Alert.alert(t('alerts.error'), error.message || t('expert.chat.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [chatExpertId, t]);

  // Setup SignalR for real-time messages
  useEffect(() => {
    if (!chatExpertId) return;

    const setupSignalR = async () => {
      try {
        // Get userId
        const userIdStr = await AsyncStorage.getItem('userId');
        const userId = userIdStr ? parseInt(userIdStr) : null;

        if (!userId) {
          console.warn('⚠️ No userId for SignalR setup');
          return;
        }

        // Ensure connected
        if (!signalRService.isConnected()) {
          await signalRService.connect(userId);
        }

        // Join expert chat group
        await signalRService.joinExpertChat(chatExpertId, userId);
        console.log(`✅ Joined expert chat group: ${chatExpertId}`);

        // Listen for new messages
        const handleNewMessage = (data: any) => {
          console.log('💬 [ExpertChat] New message received via SignalR:', data);
          console.log('💬 [ExpertChat] Current userId:', userId);
          console.log('💬 [ExpertChat] Current chatExpertId:', chatExpertId);
          console.log('💬 [ExpertChat] Message fromId:', data.FromId);
          console.log('💬 [ExpertChat] Message chatExpertId:', data.ChatExpertId);

          // Check if message is for this chat
          const messageChatId = data.ChatExpertId || data.chatExpertId;
          if (messageChatId !== chatExpertId) {
            console.log('⚠️ Message is for different chat, ignoring');
            return;
          }

          // Check if message is from current user (skip to avoid duplicate with optimistic update)
          const messageFromId = data.FromId || data.fromId;
          if (messageFromId === userId) {
            console.log('⚠️ Message is from current user, skipping (already added optimistically)');
            return;
          }

          // Add message from expert
          let dateStr = data.CreatedAt || data.createdAt;
          if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
            dateStr = dateStr + 'Z';
          }

          const newMessage: Message = {
            id: `signalr_${Date.now()}`,
            text: data.Message || data.message,
            isExpert: true, // Message from expert
            timestamp: new Date(dateStr),
            status: "sent" as const,
          };

          console.log('✅ [ExpertChat] Adding expert message:', newMessage);

          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m =>
              m.text === newMessage.text &&
              Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 2000
            );
            if (exists) {
              console.log('⚠️ Message already exists, skipping');
              return prev;
            }
            console.log('✅ Adding message to state');
            return [...prev, newMessage];
          });

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        };

        signalRService.on('ReceiveExpertMessage', handleNewMessage);

        // Cleanup on unmount
        return () => {
          signalRService.off('ReceiveExpertMessage', handleNewMessage);
          signalRService.leaveExpertChat(chatExpertId, userId).catch(err => {

          });
        };
      } catch (error) {

      }
    };

    setupSignalR();
  }, [chatExpertId]);

  // Load messages on mount
  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  const handleSend = async () => {
    if (inputText.trim() === "" || !chatExpertId || !currentUserId || !expertId) {
      console.warn('⚠️ Cannot send message: missing required data');
      return;
    }

    const messageText = inputText.trim();
    const tempId = Date.now().toString();

    // Add optimistic message
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      isExpert: false,
      timestamp: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setSending(true);
      console.log(`🔄 Sending message to chatExpertId ${chatExpertId}:`, messageText);

      // Send to API
      const sentMessage = await sendExpertChatMessage(chatExpertId, currentUserId, {
        message: messageText,
        expertId: expertId,
        userId: currentUserId,
        chatAiid: null, // Optional
      });

      // Update message with actual data from server
      let dateStr = sentMessage.createdAt;
      if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
        dateStr = dateStr + 'Z';
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
              ...msg,
              id: sentMessage.contentId.toString(),
              timestamp: new Date(dateStr),
              status: "sent" as const,
            }
            : msg
        )
      );

      console.log('✅ Message sent successfully');
    } catch (error: any) {


      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" as const } : msg
        )
      );

      Alert.alert(t('alerts.error'), error.message || t('expert.chat.errors.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    // Date object đã được convert từ UTC sang local time của device
    // Chỉ cần format lại
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View
        style={[
          styles.messageContainer,
          item.isExpert ? styles.expertMessage : styles.userMessage,
        ]}
      >
        {item.isExpert && (
          <View style={styles.expertAvatar}>
            <LinearGradient
              colors={["#4CAF50", "#66BB6A"]}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="medical" size={20} color={colors.white} />
            </LinearGradient>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            item.isExpert ? styles.expertBubble : styles.userBubble,
          ]}
        >
          {item.isExpert && (
            <View style={styles.expertBadge}>
              <Icon name="shield-checkmark" size={12} color="#4CAF50" />
              <Text style={styles.expertBadgeText}>{t('expert.chat.expertBadge')}</Text>
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              item.isExpert ? styles.expertText : styles.userText,
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timeText,
                item.isExpert ? styles.expertTimeText : styles.userTimeText,
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
            {!item.isExpert && (
              <Icon
                name={
                  item.status === "sending"
                    ? "time-outline"
                    : item.status === "sent"
                      ? "checkmark-done"
                      : "alert-circle-outline"
                }
                size={14}
                color={item.isExpert ? "#81C784" : "rgba(255, 255, 255, 0.7)"}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.emptyText}>{t('expert.chat.loading')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Icon name="chatbubbles-outline" size={64} color={colors.textLabel} />
        <Text style={styles.emptyTitle}>{t('expert.chat.empty.title')}</Text>
        <Text style={styles.emptyText}>
          {t('expert.chat.empty.message')}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#4CAF50", "#66BB6A"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.headerAvatarContainer}>
              <LinearGradient
                colors={["#FFFFFF", "#E8F5E9"]}
                style={styles.headerAvatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="medical" size={24} color="#4CAF50" />
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerName}>
                {expertName || t('expert.chat.title')}
              </Text>
              <View style={styles.expertStatusBadge}>
                <Icon name="shield-checkmark" size={12} color="#E8F5E9" />
                <Text style={styles.expertStatusText}>{t('expert.chat.verifiedExpert')}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.infoButton}>
            <Icon name="information-circle-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messagesList}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={t('expert.chat.inputPlaceholder')}
              placeholderTextColor={colors.textLabel}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (inputText.trim() === "" || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={inputText.trim() === "" || sending}
            >
              <LinearGradient
                colors={
                  inputText.trim() === "" || sending
                    ? ["#BDBDBD", "#9E9E9E"]
                    : ["#4CAF50", "#66BB6A"]
                }
                style={styles.sendButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon name="send" size={20} color={colors.white} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    ...shadows.medium,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerAvatarContainer: {
    position: "relative",
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
  },
  expertStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  expertStatusText: {
    fontSize: 13,
    color: "#E8F5E9",
    fontWeight: "500",
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLabel,
    textAlign: "center",
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
  },
  expertMessage: {
    alignSelf: "flex-start",
  },
  userMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  expertAvatar: {
    marginRight: 8,
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    borderRadius: radius.lg,
    padding: 12,
    maxWidth: "100%",
  },
  expertBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    ...shadows.small,
  },
  userBubble: {
    backgroundColor: "#7E57C2",
    borderBottomRightRadius: 4,
  },
  expertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  expertBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4CAF50",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  expertText: {
    color: colors.textDark,
  },
  userText: {
    color: colors.white,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    justifyContent: "flex-end",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  expertTimeText: {
    color: colors.textLabel,
  },
  userTimeText: {
    color: "rgba(255, 255, 255, 0.7)",
  },

  // Input
  inputContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textDark,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ExpertChatScreen;
