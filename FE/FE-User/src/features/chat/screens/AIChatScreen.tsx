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
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getChatAIHistory, sendMessageToAI, getTokenUsage } from "../api/chataiApi";
import { createExpertConfirmation } from "../../expert/api/expertConfirmationApi";
import { getAvailableExperts, Expert } from "../../expert/api/expertChatApi";
import CustomAlert from "../../../components/CustomAlert";
import { LimitReachedModal } from "../../../components/LimitReachedModal";
import { TokenLimitModal } from "../../../components/TokenLimitModal";
import OptimizedImage from "../../../components/OptimizedImage";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "AIChat">;

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
  suggestions?: string[];
}

/**
 * Loại bỏ markdown formatting từ text AI response
 */
const stripMarkdown = (text: string): string => {
  if (!text) return text;
  
  return text
    // Loại bỏ ***text***
    .replace(/\*{3}(.*?)\*{3}/g, '$1')
    // Loại bỏ **text**
    .replace(/\*{2}(.*?)\*{2}/g, '$1')
    // Loại bỏ *text* (nhưng không phải bullet point)
    .replace(/\*([^\s*][^*]*[^\s*])\*/g, '$1')
    .replace(/\*([^\s*])\*/g, '$1')
    // Chuyển bullet point * thành •
    .replace(/^\s*\*\s+/gm, '• ')
    // Loại bỏ _text_
    .replace(/_(.*?)_/g, '$1')
    // Loại bỏ # headers
    .replace(/^#{1,6}\s+/gm, '')
    // Loại bỏ ```code```
    .replace(/```[\s\S]*?```/g, '')
    // Loại bỏ `code`
    .replace(/`([^`]+)`/g, '$1')
    // Loại bỏ [text](url)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .trim();
};

const AIChatScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
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

  // Expert selection states
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [expertSelectionStep, setExpertSelectionStep] = useState<'select' | 'question'>('select');

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
          text: t('chat.ai.welcome'),
          isAI: true,
          timestamp: new Date(),
          suggestions: [
            t('chat.ai.suggestions.careTips'),
            t('chat.ai.suggestions.healthAdvice'),
            t('chat.ai.suggestions.trainingTips'),
            t('chat.ai.suggestions.nutritionGuide'),
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
    } catch (error) {

    }
  };

  const loadChatHistory = async () => {
    try {
      setLoading(true);

      const chatData = await getChatAIHistory(parseInt(chatId));
      setChatTitle(chatData.chatTitle);

      // Convert API messages to Message format
      const formattedMessages: Message[] = [];

      chatData.messages.forEach(msg => {
        // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
        let dateString = msg.createdAt;
        if (!dateString.endsWith('Z') && !dateString.includes('+')) {
          dateString = dateString + 'Z';
        }

        // User question
        formattedMessages.push({
          id: `${msg.contentId}-q`,
          text: msg.question,
          isAI: false,
          timestamp: new Date(dateString), // Parse as UTC, auto converts to local time
        });

        // AI answer
        formattedMessages.push({
          id: `${msg.contentId}-a`,
          text: msg.answer,
          isAI: true,
          timestamp: new Date(dateString), // Parse as UTC, auto converts to local time
        });
      });

      setMessages(formattedMessages);
    } catch (error: any) {

      Alert.alert(t('common.error'), error.message || t('chat.ai.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();

    if (!messageText) return;

    if (chatId === "new") {
      Alert.alert(t('common.error'), t('chat.ai.createChatFirst'));
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
      const response = await sendMessageToAI(parseInt(chatId), messageText);

      if (response.usage) {
        setTokenUsage(response.usage);

        if (response.usage.exceededQuota) {
          setTimeout(() => {
            setShowTokenLimitModal(true);
          }, 1000);
        }
      }

      // Add AI response to messages
      // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
      let timestampString = response.timestamp;
      if (typeof timestampString === 'string' && !timestampString.endsWith('Z') && !timestampString.includes('+')) {
        timestampString = timestampString + 'Z';
      }
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: response.answer,
        isAI: true,
        timestamp: new Date(timestampString), // Parse as UTC, auto converts to local time
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
        }

        setShowTokenLimitModal(true);
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // Timeout error
        Alert.alert(
          t('chat.ai.aiOverloaded'),
          t('chat.ai.aiOverloadedMessage')
        );
      } else if (error.response?.status === 500) {
        // Backend error with custom message
        const errorMsg = error.response?.data?.message || t('chat.ai.sendError');
        Alert.alert(t('common.error'), errorMsg);
      } else {
        // Generic error

        const errorMsg = error.response?.data?.message || error.message || t('chat.ai.sendError');
        Alert.alert(t('common.error'), errorMsg);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleAskExpert = async (message: Message) => {
    setUserQuestion(""); // Reset to empty - user must type their own question
    setSelectedMessage(message);
    setSelectedExpert(null);
    setExpertSelectionStep('select');
    setShowQuestionModal(true);
    
    // Load experts list
    try {
      setLoadingExperts(true);
      const expertsList = await getAvailableExperts();
      setExperts(expertsList);
    } catch (error) {
      setErrorMessage('Không thể tải danh sách chuyên gia');
      setShowErrorAlert(true);
    } finally {
      setLoadingExperts(false);
    }
  };

  const handleSelectExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setExpertSelectionStep('question');
  };

  const handleBackToExpertSelection = () => {
    setExpertSelectionStep('select');
    setSelectedExpert(null);
  };

  const handleConfirmExpertRequest = async () => {
    if (!selectedMessage) return;
    
    // Validate selected expert
    if (!selectedExpert) {
      setErrorMessage('Vui lòng chọn một chuyên gia');
      setShowErrorAlert(true);
      return;
    }
    
    // Validate user question
    if (!userQuestion.trim()) {
      setErrorMessage(t('chat.expert.emptyQuestion'));
      setShowErrorAlert(true);
      return;
    }

    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setErrorMessage(t('chat.aiList.userNotFound'));
        setShowErrorAlert(true);
        return;
      }

      const userId = parseInt(userIdStr);

      // Get current chatId from route or state
      const currentChatId = route.params?.chatId;
      if (!currentChatId || currentChatId === 'new') {
        setErrorMessage(t('chat.expert.saveChatFirst'));
        setShowErrorAlert(true);
        return;
      }

      const chatAiId = parseInt(currentChatId);

      setSubmittingExpert(true);

      await createExpertConfirmation(userId, chatAiId, {
        expertId: selectedExpert.userId,
        userQuestion: userQuestion.trim(),
        message: undefined  // Message will be filled by expert when they respond
      });

      // Mark this message as sent to expert
      setSentToExpertIds(prev => new Set(prev).add(selectedMessage.id));

      // Close modal and reset
      setShowQuestionModal(false);
      setUserQuestion("");
      setSelectedExpert(null);
      setExpertSelectionStep('select');
      
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
        setErrorMessage(errorMsg || t('chat.expert.submitError'));
        setShowErrorAlert(true);
      } else {

        setErrorMessage(error.message || t('chat.expert.submitError'));
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
                <Text style={styles.aiLabel}>{t('chat.ai.aiLabel')}</Text>
                <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
              </View>
              <Text style={styles.aiMessageText}>{stripMarkdown(item.text)}</Text>

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
                    <Text style={styles.askExpertText}>{t('chat.expert.askExpert')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Show "Sent to Expert" badge if this specific message was sent */}
              {item.id !== "welcome" && sentToExpertIds.has(item.id) && (
                <View style={styles.sentToExpertBadge}>
                  <Icon name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.sentToExpertText}>{t('chat.expert.sentToExpert')}</Text>
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
              <Text style={styles.headerStatus}>{t('chat.ai.loading')}</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.aiPrimary} />
          <Text style={styles.loadingText}>{t('chat.ai.loadingChat')}</Text>
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
              <Text style={styles.headerName}>{t('chat.ai.title')}</Text>
              <Text style={styles.headerStatus}>
                {isTyping ? t('chat.ai.typing') : 'Trợ lý AI thú cưng'}
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
            <TextInput
              style={styles.input}
              placeholder={t('chat.ai.inputPlaceholder')}
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
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
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

            {/* Step 1: Select Expert */}
            {expertSelectionStep === 'select' && (
              <ScrollView 
                style={styles.modalBody}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                bounces={true}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
              >
                <Text style={styles.modalTitle}>Chọn chuyên gia</Text>
                <Text style={styles.modalDescription}>
                  Chọn một bác sĩ/chuyên gia để gửi câu hỏi xác nhận
                </Text>

                {loadingExperts ? (
                  <View style={styles.expertLoadingContainer}>
                    <ActivityIndicator size="large" color={colors.success} />
                    <Text style={styles.expertLoadingText}>Đang tải danh sách chuyên gia...</Text>
                  </View>
                ) : experts.length === 0 ? (
                  <View style={styles.noExpertsContainer}>
                    <Icon name="people-outline" size={48} color={colors.textLabel} />
                    <Text style={styles.noExpertsText}>Chưa có chuyên gia nào</Text>
                  </View>
                ) : (
                  <View style={styles.expertListContainer}>
                    {experts.map((expert) => (
                      <TouchableOpacity
                        key={expert.userId}
                        style={[
                          styles.expertCard,
                          selectedExpert?.userId === expert.userId && styles.expertCardSelected
                        ]}
                        onPress={() => handleSelectExpert(expert)}
                      >
                        <View style={styles.expertAvatarContainer}>
                          {expert.avatarUrl ? (
                            <OptimizedImage
                              source={{ uri: expert.avatarUrl }}
                              style={styles.expertAvatar}
                            />
                          ) : (
                            <LinearGradient
                              colors={["#4CAF50", "#81C784"]}
                              style={styles.expertAvatarPlaceholder}
                            >
                              <Icon name="person" size={24} color={colors.white} />
                            </LinearGradient>
                          )}
                          {expert.isOnline && <View style={styles.onlineIndicator} />}
                        </View>
                        <View style={styles.expertInfo}>
                          <Text style={styles.expertName}>{expert.fullName}</Text>
                          <Text style={styles.expertSpecialty}>{expert.specialty || 'Chuyên gia thú y'}</Text>
                        </View>
                        <Icon 
                          name={selectedExpert?.userId === expert.userId ? "checkmark-circle" : "chevron-forward"} 
                          size={24} 
                          color={selectedExpert?.userId === expert.userId ? colors.success : colors.textLabel} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            {/* Step 2: Enter Question */}
            {expertSelectionStep === 'question' && selectedExpert && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                bounces={true}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
              >
                {/* Selected Expert Info */}
                <View style={styles.selectedExpertBanner}>
                  <View style={styles.selectedExpertInfo}>
                    {selectedExpert.avatarUrl ? (
                      <OptimizedImage
                        source={{ uri: selectedExpert.avatarUrl }}
                        style={styles.selectedExpertAvatar}
                      />
                    ) : (
                      <LinearGradient
                        colors={["#4CAF50", "#81C784"]}
                        style={styles.selectedExpertAvatarPlaceholder}
                      >
                        <Icon name="person" size={16} color={colors.white} />
                      </LinearGradient>
                    )}
                    <View style={styles.selectedExpertText}>
                      <Text style={styles.selectedExpertLabel}>Gửi đến chuyên gia</Text>
                      <Text style={styles.selectedExpertName}>{selectedExpert.fullName}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleBackToExpertSelection}>
                    <Text style={styles.changeExpertText}>Thay đổi</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>{t('chat.expert.modalTitle')}</Text>
                <Text style={styles.modalDescription}>
                  {t('chat.expert.modalDescription')}
                </Text>

                {/* AI Response - Full Display */}
                <View style={styles.aiResponseSection}>
                  <View style={styles.aiResponseHeader}>
                    <Icon name="sparkles" size={18} color={colors.aiPrimary} />
                    <Text style={styles.aiResponseHeaderText}>{t('chat.expert.aiResponseHeader')}</Text>
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
                    {t('chat.expert.questionLabel')} <Text style={styles.required}>{t('chat.expert.required')}</Text>
                  </Text>
                  <Text style={styles.questionHint}>
                    {t('chat.expert.questionHint')}
                  </Text>
                  <TextInput
                    style={styles.questionInput}
                    placeholder={t('chat.expert.questionPlaceholder')}
                    placeholderTextColor={colors.textLabel}
                    value={userQuestion}
                    onChangeText={setUserQuestion}
                    multiline
                    numberOfLines={5}
                    maxLength={500}
                    textAlignVertical="top"
                  />
                  <Text style={styles.characterCount}>
                    {t('chat.expert.charCount', { count: userQuestion.length })}
                  </Text>
                </View>

                <View style={styles.infoBox}>
                  <Icon name="information-circle" size={20} color="#4CAF50" />
                  <Text style={styles.infoText}>
                    {t('chat.expert.infoText')}
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  if (expertSelectionStep === 'question') {
                    handleBackToExpertSelection();
                  } else {
                    setShowQuestionModal(false);
                  }
                }}
              >
                <Text style={styles.modalCancelButtonText}>
                  {expertSelectionStep === 'question' ? 'Quay lại' : t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton, 
                  (submittingExpert || (expertSelectionStep === 'question' && !userQuestion.trim())) && styles.modalButtonDisabled
                ]}
                onPress={expertSelectionStep === 'select' ? () => selectedExpert && setExpertSelectionStep('question') : handleConfirmExpertRequest}
                disabled={
                  expertSelectionStep === 'select' 
                    ? !selectedExpert 
                    : (submittingExpert || !userQuestion.trim())
                }
              >
                <LinearGradient
                  colors={
                    (expertSelectionStep === 'select' ? selectedExpert : userQuestion.trim()) && !submittingExpert 
                      ? ["#4CAF50", "#81C784"] 
                      : ["#E0E0E0", "#BDBDBD"]
                  }
                  style={styles.modalConfirmGradient}
                >
                  {submittingExpert ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : expertSelectionStep === 'select' ? (
                    <>
                      <Text style={styles.modalConfirmButtonText}>Tiếp tục</Text>
                      <Icon name="arrow-forward" size={18} color={colors.white} />
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={18} color={colors.white} />
                      <Text style={styles.modalConfirmButtonText}>{t('chat.expert.submitButton')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Alert */}
      <CustomAlert
        visible={showSuccessAlert}
        type="success"
        title={t('chat.expert.successTitle')}
        message={t('chat.expert.successMessage')}
        confirmText={t('chat.expert.viewRequests')}
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
        title={t('common.error')}
        message={errorMessage}
        confirmText={t('common.close')}
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
        isVip={tokenUsage?.isVip || false}
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
    overflow: "hidden",
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
    flexGrow: 1,
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

  // Expert Selection Styles
  expertLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  expertLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMedium,
  },
  noExpertsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noExpertsText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textLabel,
  },
  expertListContainer: {
    maxHeight: 350,
  },
  expertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  expertCardSelected: {
    borderColor: colors.success,
    backgroundColor: '#E8F5E9',
  },
  expertAvatarContainer: {
    position: 'relative',
  },
  expertAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  expertAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  expertInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expertName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  expertSpecialty: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },

  // Selected Expert Banner
  selectedExpertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  selectedExpertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedExpertAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  selectedExpertAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedExpertText: {
    marginLeft: 10,
  },
  selectedExpertLabel: {
    fontSize: 11,
    color: colors.textMedium,
  },
  selectedExpertName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  changeExpertText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AIChatScreen;
