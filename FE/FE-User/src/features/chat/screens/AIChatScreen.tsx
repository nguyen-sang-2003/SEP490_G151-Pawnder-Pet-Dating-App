import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getChatAIHistory, sendMessageToAI, createExpertConfirmation } from "../../../api";
import CustomAlert from "../../../components/CustomAlert";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "AIChat">;

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
  suggestions?: string[];
}


const AIChatScreen = ({ navigation, route }: Props) => {
  const chatId = route.params?.chatId || "new";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatTitle, setChatTitle] = useState("AI Chat");
  const flatListRef = useRef<FlatList>(null);

  // Alert states
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Load chat history on mount
  useEffect(() => {
    if (chatId && chatId !== "new") {
      loadChatHistory();
    } else {
      // New chat - show welcome message
      setMessages([
        {
          id: "welcome",
          text: "Hi there! 👋 I'm your AI Pet Care Assistant. I'm here to help you with any questions about your cat! How can I assist you today?",
          isAI: true,
          timestamp: new Date(),
          suggestions: [
            "Pet care tips",
            "Health advice",
            "Training tips",
            "Nutrition guide",
          ],
        },
      ]);
      setLoading(false);
    }
  }, [chatId]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      console.log('📞 Loading AI chat history:', chatId);
      
      const chatData = await getChatAIHistory(parseInt(chatId));
      setChatTitle(chatData.chatTitle);
      
      // Convert API messages to Message format
      const formattedMessages: Message[] = [];
      
      chatData.messages.forEach(msg => {
        // User question
        formattedMessages.push({
          id: `${msg.contentId}-q`,
          text: msg.question,
          isAI: false,
          timestamp: new Date(msg.createdAt),
        });
        
        // AI answer
        formattedMessages.push({
          id: `${msg.contentId}-a`,
          text: msg.answer,
          isAI: true,
          timestamp: new Date(msg.createdAt),
        });
      });
      
      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('❌ Error loading chat history:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải lịch sử chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    
    if (!messageText) return;
    
    if (chatId === "new") {
      Alert.alert('Lỗi', 'Vui lòng tạo cuộc trò chuyện mới trước');
      return;
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      isAI: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Show typing indicator
    setIsTyping(true);

    try {
      console.log('📞 Sending message to AI:', { chatId, messageText });
      
      // Call API
      const response = await sendMessageToAI(parseInt(chatId), messageText);
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: response.answer,
        isAI: true,
        timestamp: new Date(response.timestamp),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Error sending message to AI:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi tin nhắn');
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  const handleAskExpert = (message: Message) => {
    setSelectedMessage(message);
    setShowConfirmAlert(true);
  };

  const handleConfirmExpertRequest = async () => {
    if (!selectedMessage) return;

    // Find user's question before this AI response
    const messageIndex = messages.findIndex(m => m.id === selectedMessage.id);
    const userQuestion = messageIndex > 0 ? messages[messageIndex - 1] : null;

    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setErrorMessage('Không tìm thấy thông tin người dùng');
        setShowErrorAlert(true);
        return;
      }

      const userId = parseInt(userIdStr);
      
      // Get current chatId from route or state
      const currentChatId = route.params?.chatId;
      if (!currentChatId || currentChatId === 'new') {
        setErrorMessage('Vui lòng lưu cuộc trò chuyện trước khi yêu cầu chuyên gia');
        setShowErrorAlert(true);
        return;
      }

      const chatAiId = parseInt(currentChatId);

      console.log('📤 Requesting expert confirmation:', {
        userId,
        chatAiId,
        question: userQuestion?.text,
        aiResponse: selectedMessage.text
      });

      // Create expert confirmation request
      const expertId = 1; // Default expert
      
      const fullMessage = userQuestion 
        ? `Câu hỏi: "${userQuestion.text}"\n\nLời khuyên AI: "${selectedMessage.text}"`
        : `Lời khuyên AI: "${selectedMessage.text}"`;

      await createExpertConfirmation(userId, chatAiId, {
        expertId: expertId,
        message: fullMessage
      });

      // Show success
      setShowSuccessAlert(true);
      
    } catch (error: any) {
      console.error('❌ Error requesting expert:', error);
      setErrorMessage(error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
      setShowErrorAlert(true);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSend(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageWrapper}>
      <View
        style={[
          styles.messageContainer,
          item.isAI ? styles.aiMessage : styles.userMessage,
        ]}
      >
        {item.isAI && (
          <View style={styles.aiAvatarContainer}>
            <LinearGradient
              colors={gradients.ai}
              style={styles.aiAvatar}
            >
              <Icon name="sparkles" size={20} color={colors.white} />
            </LinearGradient>
          </View>
        )}
        
        <View
          style={[
            styles.messageBubble,
            item.isAI ? styles.aiBubble : styles.userBubble,
          ]}
        >
          {item.isAI ? (
            <View style={styles.aiContent}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiLabel}>AI Assistant</Text>
                <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
              </View>
              <Text style={styles.aiMessageText}>{item.text}</Text>
              
              {/* Ask Expert Button */}
              {item.id !== "welcome" && (
                <TouchableOpacity
                  style={styles.askExpertButton}
                  onPress={() => handleAskExpert(item)}
                >
                  <LinearGradient
                    colors={[colors.success, "#81C784"]}
                    style={styles.askExpertGradient}
                  >
                    <Icon name="shield-checkmark" size={16} color={colors.white} />
                    <Text style={styles.askExpertText}>Ask Expert to Confirm</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <LinearGradient
              colors={gradients.primary}
              style={styles.userBubbleGradient}
            >
              <Text style={styles.userMessageText}>{item.text}</Text>
            </LinearGradient>
          )}
        </View>
      </View>

      {/* Suggestions */}
      {item.suggestions && item.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {item.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <LinearGradient
        colors={gradients.background}
        style={styles.container}
      >
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
              style={styles.headerAvatar}
            >
              <Icon name="sparkles" size={24} color={colors.white} />
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{chatTitle}</Text>
              <Text style={styles.headerStatus}>Loading...</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.aiPrimary} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#FFFFFF", "#FFF8FB"]}
        style={styles.headerGradient}
      >
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
            style={styles.headerAvatar}
          >
            <Icon name="sparkles" size={24} color={colors.white} />
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>AI Pet Assistant</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? "typing..." : "Always active "}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate("ExpertConfirmation" as any)}
        >
          <LinearGradient
            colors={["#4CAF50", "#81C784"]}
            style={styles.menuIconGradient}
          >
            <Icon name="shield-checkmark" size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </LinearGradient>


      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <LinearGradient
              colors={gradients.ai}
              style={styles.typingAvatar}
            >
              <Icon name="sparkles" size={16} color={colors.white} />
            </LinearGradient>
            <View style={styles.typingBubble}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, { marginLeft: 4 }]} />
              <View style={[styles.typingDot, { marginLeft: 4 }]} />
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="camera-outline" size={28} color={colors.aiPrimary} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Ask me anything about cat care..."
              placeholderTextColor={colors.textLabel}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? gradients.ai : ["#E0E0E0", "#BDBDBD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendGradient}
              >
                  <Icon
                    name="send"
                    size={20}
                    color={colors.white}
                  />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Confirm Expert Request Alert */}
      <CustomAlert
        visible={showConfirmAlert}
        type="info"
        title="Yêu cầu chuyên gia xác nhận"
        message={`Bạn muốn chuyên gia thú y xem xét lời khuyên này?\n\n"${selectedMessage?.text.substring(0, 80)}..."`}
        showCancel={true}
        cancelText="Hủy"
        confirmText="Gửi yêu cầu"
        onClose={() => setShowConfirmAlert(false)}
        onConfirm={handleConfirmExpertRequest}
      />

      {/* Success Alert */}
      <CustomAlert
        visible={showSuccessAlert}
        type="success"
        title="Đã gửi yêu cầu!"
        message="Yêu cầu của bạn đã được gửi đến chuyên gia. Bạn sẽ nhận được thông báo khi họ phản hồi."
        confirmText="Xem yêu cầu của tôi"
        onClose={() => setShowSuccessAlert(false)}
        onConfirm={() => {
          setShowSuccessAlert(false);
          navigation.navigate("ExpertConfirmation" as any);
        }}
      />

      {/* Error Alert */}
      <CustomAlert
        visible={showErrorAlert}
        type="error"
        title="Lỗi"
        message={errorMessage}
        confirmText="Đóng"
        onClose={() => setShowErrorAlert(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
  },
  keyboardView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 12,
    ...shadows.small,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
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
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.aiPrimary,
    marginTop: 2,
  },
  menuButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },

  // Quick Questions
  quickQuestionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 12,
  },
  quickQuestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickQuestionCard: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: "rgba(255, 154, 118, 0.2)",
    ...shadows.small,
  },
  quickQuestionText: {
    fontSize: 14,
    color: colors.aiPrimary,
    fontWeight: "500",
  },

  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  aiAvatarContainer: {
    marginRight: 8,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: radius.lg,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    backgroundColor: colors.whiteWarm,
    ...shadows.small,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiContent: {
    padding: 12,
  },
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.aiPrimary,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textLabel,
  },
  aiMessageText: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },

  // Ask Expert Button
  askExpertButton: {
    marginTop: 10,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  askExpertGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  askExpertText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },

  userBubbleGradient: {
    padding: 12,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  userMessageText: {
    fontSize: 15,
    color: colors.white,
    lineHeight: 22,
  },

  // Suggestions
  suggestionsContainer: {
    marginTop: 8,
    marginLeft: 44,
  },
  suggestionsScroll: {
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: "rgba(156, 39, 176, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(156, 39, 176, 0.3)",
  },
  suggestionText: {
    fontSize: 13,
    color: colors.aiPrimary,
    fontWeight: "500",
  },

  // Typing Indicator
  typingIndicator: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  typingBubble: {
    flexDirection: "row",
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    ...shadows.small,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.aiPrimary,
    opacity: 0.6,
  },

  // Input
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 154, 118, 0.15)",
    ...shadows.medium,
  },
  attachButton: {
    padding: 4,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginLeft: 4,
  },
  sendGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
    fontWeight: '600',
  },
});

export default AIChatScreen;
