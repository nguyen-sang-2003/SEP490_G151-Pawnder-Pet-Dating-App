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
  Modal,
  Pressable,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getChatAIHistory, sendMessageToAI, getTokenUsage } from "../api/chataiApi";
import { createExpertConfirmation } from "../../expert/api/expertConfirmationApi";
import CustomAlert from "../../../components/CustomAlert";
import { LimitReachedModal } from "../../../components/LimitReachedModal";
import { TokenLimitModal } from "../../../components/TokenLimitModal";

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

  // Token usage states
  const [tokenUsage, setTokenUsage] = useState<{
    isVip: boolean;
    dailyQuota: number;
    tokensUsed: number;
    tokensRemaining: number;
  } | null>(null);

  // Alert states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [submittingExpert, setSubmittingExpert] = useState(false);

  // Limit modal states
  const [showTokenLimitModal, setShowTokenLimitModal] = useState(false);
  const [showExpertLimitModal, setShowExpertLimitModal] = useState(false);
  const [expertLimitMessage, setExpertLimitMessage] = useState("");

  // Track which messages have been sent to expert
  const [sentToExpertIds, setSentToExpertIds] = useState<Set<string>>(new Set());

  // Load chat history and token usage on mount
  useEffect(() => {
    loadTokenUsage(); // Load token usage first

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

  const loadTokenUsage = async () => {
    try {
      const usage = await getTokenUsage();
      setTokenUsage(usage);
      console.log('📊 Initial token usage:', usage);
    } catch (error) {

    }
  };

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

    // Check quota trước khi gửi (tránh delay)
    if (tokenUsage) {
      const estimatedTokens = Math.ceil(messageText.length / 2) * 4; // Ước lượng
      if (tokenUsage.tokensRemaining < estimatedTokens) {
        setShowTokenLimitModal(true);
        return;
      }
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

      // Update token usage
      if (response.usage) {
        setTokenUsage(response.usage);
        console.log('📊 Token usage:', response.usage);
        console.log('📊 Token details:', response.tokenDetails);

        // Check nếu vượt quota sau khi trả lời → hiện modal
        if (response.usage.exceededQuota) {
          setTimeout(() => {
            setShowTokenLimitModal(true);
          }, 1000); // Delay 1s để user đọc câu trả lời trước
        }
      }

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
      // Remove user message on any error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));

      // Check if it's a 429 limit error
      if (error.response?.status === 429) {
        const errorData = error.response?.data;

        // Update token usage from error response
        if (errorData?.usage) {
          setTokenUsage(errorData.usage);
          console.log('📊 Token usage (from error):', errorData.usage);
        }

        setShowTokenLimitModal(true);
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // Timeout error
        Alert.alert(
          'AI đang quá tải',
          'AI đang mất nhiều thời gian để xử lý. Vui lòng thử lại sau vài giây.'
        );
      } else if (error.response?.status === 500) {
        // Backend error with custom message
        const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra với AI. Vui lòng thử lại.';
        Alert.alert('Lỗi', errorMsg);
      } else {
        // Generic error

        const errorMsg = error.response?.data?.message || error.message || 'Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.';
        Alert.alert('Lỗi', errorMsg);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleAskExpert = (message: Message) => {
    setUserQuestion(""); // Reset to empty - user must type their own question
    setSelectedMessage(message);
    setShowQuestionModal(true);
  };

  const handleConfirmExpertRequest = async () => {
    if (!selectedMessage) return;
    
    // Validate user question
    if (!userQuestion.trim()) {
      setErrorMessage('Vui lòng nhập câu hỏi của bạn');
      setShowErrorAlert(true);
      return;
    }

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

      setSubmittingExpert(true);
      
      console.log('📤 Requesting expert confirmation:', {
        userId,
        chatAiId,
        question: userQuestion.trim(),
        aiResponse: selectedMessage.text
      });

      // Create expert confirmation request (expert will be auto-assigned by backend)
      await createExpertConfirmation(userId, chatAiId, {
        userQuestion: userQuestion.trim(),
        message: undefined  // Message will be filled by expert when they respond
      });

      // Mark this message as sent to expert
      setSentToExpertIds(prev => new Set(prev).add(selectedMessage.id));

      // Close modal and reset
      setShowQuestionModal(false);
      setUserQuestion("");
      
      // Show success
      setShowSuccessAlert(true);

    } catch (error: any) {
      // Check if it's a 429 (daily limit reached)
      if (error.response?.status === 429) {
        const responseData = error.response.data;
        const limitMsg = responseData.message || 'Bạn đã hết lượt xác nhận chuyên gia hôm nay!';
        setExpertLimitMessage(limitMsg);
        setShowExpertLimitModal(true);
      } else if (error.response?.status === 400) {
        // Show error message from backend
        const errorMsg = error.response?.data?.Message || error.response?.data?.message || '';
        setErrorMessage(errorMsg || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
        setShowErrorAlert(true);
      } else {

        setErrorMessage(error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
        setShowErrorAlert(true);
      }
    } finally {
      setSubmittingExpert(false);
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

              {/* Ask Expert Button - Hide only for specific message that was sent */}
              {item.id !== "welcome" && !sentToExpertIds.has(item.id) && (
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

              {/* Show "Sent to Expert" badge if this specific message was sent */}
              {item.id !== "welcome" && sentToExpertIds.has(item.id) && (
                <View style={styles.sentToExpertBadge}>
                  <Icon name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.sentToExpertText}>Sent to Expert</Text>
                </View>
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
                {isTyping ? "typing..." : tokenUsage
                  ? (tokenUsage.tokensUsed >= tokenUsage.dailyQuota
                    ? "Limit reached (100%)"
                    : `${tokenUsage.tokensUsed.toLocaleString()}/${tokenUsage.dailyQuota.toLocaleString()} tokens`)
                  : "0/10,000 tokens"}
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

      {/* Question Modal for Expert Confirmation */}
      <Modal
        visible={showQuestionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuestionModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={["#4CAF50", "#81C784"]}
                style={styles.modalIconGradient}
              >
                <Icon name="shield-checkmark" size={32} color={colors.white} />
              </LinearGradient>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowQuestionModal(false)}
              >
                <Icon name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Yêu cầu chuyên gia xác nhận</Text>
              <Text style={styles.modalDescription}>
                Nhập câu hỏi của bạn để chuyên gia thú y có thể hiểu rõ vấn đề và đưa ra lời khuyên chính xác nhất.
              </Text>

              {/* AI Response - Full Display */}
              <View style={styles.aiResponseSection}>
                <View style={styles.aiResponseHeader}>
                  <Icon name="sparkles" size={18} color={colors.aiPrimary} />
                  <Text style={styles.aiResponseHeaderText}>Câu trả lời của AI</Text>
                </View>
                <ScrollView style={styles.aiResponseScrollView} nestedScrollEnabled>
                  <Text style={styles.aiResponseFullText}>
                    {selectedMessage?.text}
                  </Text>
                </ScrollView>
              </View>

              {/* Question Input */}
              <View style={styles.questionInputContainer}>
                <Text style={styles.questionLabel}>
                  Câu hỏi/thắc mắc của bạn về câu trả lời này <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.questionHint}>
                  Hãy mô tả chi tiết vấn đề hoặc thắc mắc của bạn để chuyên gia có thể tư vấn chính xác
                </Text>
                <TextInput
                  style={styles.questionInput}
                  placeholder="Ví dụ: Mèo của tôi bị chảy nước mắt và hắt hơi liên tục. Có phải mèo bị cảm không? Tôi cần làm gì?"
                  placeholderTextColor={colors.textLabel}
                  value={userQuestion}
                  onChangeText={setUserQuestion}
                  multiline
                  numberOfLines={5}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>
                  {userQuestion.length}/500
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Icon name="information-circle" size={20} color="#4CAF50" />
                <Text style={styles.infoText}>
                  Chuyên gia sẽ xem xét câu hỏi và câu trả lời của AI, sau đó gửi phản hồi cho bạn qua thông báo.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowQuestionModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, submittingExpert && styles.modalButtonDisabled]}
                onPress={handleConfirmExpertRequest}
                disabled={submittingExpert || !userQuestion.trim()}
              >
                <LinearGradient
                  colors={userQuestion.trim() && !submittingExpert ? ["#4CAF50", "#81C784"] : ["#E0E0E0", "#BDBDBD"]}
                  style={styles.modalConfirmGradient}
                >
                  {submittingExpert ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Icon name="send" size={18} color={colors.white} />
                      <Text style={styles.modalConfirmButtonText}>Gửi yêu cầu</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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

      {/* Token Limit Modal */}
      <TokenLimitModal
        visible={showTokenLimitModal}
        onClose={() => setShowTokenLimitModal(false)}
        onUpgrade={() => {
          setShowTokenLimitModal(false);
          navigation.navigate("Premium" as any);
        }}
        isVip={tokenUsage?.isVip || false}
        tokensUsed={tokenUsage?.tokensUsed || 0}
        dailyQuota={tokenUsage?.dailyQuota || 10000}
        tokensRemaining={tokenUsage?.tokensRemaining || 0}
      />

      {/* Expert Confirmation Limit Modal */}
      <LimitReachedModal
        visible={showExpertLimitModal}
        onClose={() => setShowExpertLimitModal(false)}
        message={expertLimitMessage}
        actionType="expert_confirm"
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

  // Sent to Expert Badge
  sentToExpertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  sentToExpertText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.success,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    width: "100%",
    maxHeight: "85%",
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 16,
  },
  modalIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    paddingHorizontal: 20,
    maxHeight: 500,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
    marginBottom: 16,
  },
  aiResponseSection: {
    backgroundColor: "#F8F8F8",
    borderRadius: radius.md,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(156, 39, 176, 0.2)",
    overflow: "hidden",
  },
  aiResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(156, 39, 176, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(156, 39, 176, 0.15)",
  },
  aiResponseHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.aiPrimary,
  },
  aiResponseScrollView: {
    maxHeight: 150,
    padding: 12,
  },
  aiResponseFullText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 22,
  },
  questionInputContainer: {
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 4,
  },
  questionHint: {
    fontSize: 12,
    color: colors.textMedium,
    lineHeight: 18,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  questionInput: {
    backgroundColor: colors.whiteWarm,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.textDark,
    minHeight: 100,
    maxHeight: 150,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textLabel,
    textAlign: "right",
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#4CAF50",
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.cardBackgroundLight,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMedium,
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalConfirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  modalConfirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },
});

export default AIChatScreen;
