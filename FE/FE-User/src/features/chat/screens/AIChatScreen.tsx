import React, { useState, useRef } from "react";
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
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "AIChat">;

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
  suggestions?: string[];
}

const QUICK_QUESTIONS = [
  "🐱 What should I feed my cat?",
  "🏃 How much exercise does my cat need?",
  "💊 When should I vaccinate my cat?",
  "🎾 Fun activities for indoor cats?",
];

const AIChatScreen = ({ navigation, route }: Props) => {
  const chatId = route.params?.chatId || "new";
  
  const [messages, setMessages] = useState<Message[]>([
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
  
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const aiResponses = [
        "That's a great question! Based on your cat's needs, I'd recommend feeding them high-quality protein-rich food 2-3 times daily. Persian cats particularly need food that supports their coat health.",
        "Let me help you with that! For indoor cats, I suggest 15-20 minutes of playtime twice daily. Use interactive toys like feather wands or laser pointers to keep them active.",
        "Great question! Vaccination is crucial for cat health. Kittens should get their first shots at 6-8 weeks, with boosters at 12 and 16 weeks. Adult cats need annual boosters.",
        "For training, cats respond well to positive reinforcement. Use treats and praise when they use the litter box correctly or come when called. Be patient and consistent!",
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        isAI: true,
        timestamp: new Date(),
        suggestions: [
          "Tell me more",
          "Any other tips?",
          "Thank you!",
        ],
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const handleSend = (text?: string) => {
    const messageText = text || inputText.trim();
    
    if (messageText) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isAI: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputText("");
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      simulateAIResponse(messageText);
    }
  };

  const handleAskExpert = (message: Message) => {
    // Find user's question before this AI response
    const messageIndex = messages.findIndex(m => m.id === message.id);
    const userQuestion = messageIndex > 0 ? messages[messageIndex - 1] : null;
    
    Alert.alert(
      "Ask Expert to Confirm",
      `Do you want an expert to review this AI advice?\n\n"${message.text.substring(0, 100)}..."`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Ask Expert",
          onPress: () => {
            // TODO: Call API - POST /expert-confirmation/{userId}/{chatId}
            // Send: userQuestion, aiResponse, full chat context
            
            Alert.alert(
              "Request Sent!",
              "Your request has been sent to our experts. You'll receive a notification when they respond.",
              [
                {
                  text: "View My Requests",
                  onPress: () => navigation.navigate("ExpertConfirmation" as any),
                },
                { text: "OK" },
              ]
            );
          },
        },
      ]
    );
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
              colors={["#667EEA", "#8B9FEE"]}
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
                    colors={["#4CAF50", "#81C784"]}
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

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
    >
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
            colors={["#667EEA", "#8B9FEE"]}
            style={styles.headerAvatar}
          >
            <Icon name="sparkles" size={24} color={colors.white} />
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>AI Pet Assistant</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? "typing..." : "Always active"}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate("ExpertConfirmation" as any)}
        >
          <Icon name="shield-checkmark" size={22} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <View style={styles.quickQuestionsContainer}>
          <Text style={styles.quickQuestionsTitle}>Quick Questions</Text>
          <View style={styles.quickQuestionsGrid}>
            {QUICK_QUESTIONS.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionCard}
                onPress={() => handleSend(question)}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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
              colors={["#667EEA", "#8B9FEE"]}
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
              <Icon name="camera-outline" size={28} color="#667EEA" />
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
                colors={inputText.trim() ? ["#667EEA", "#764BA2"] : ["#DDD", "#CCC"]}
                style={styles.sendGradient}
              >
                <Icon
                  name="send"
                  size={20}
                  color={inputText.trim() ? colors.white : colors.textLabel}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* AI Badge */}
      <View style={styles.aiBadge}>
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          style={styles.aiBadgeGradient}
        >
          <Icon name="sparkles" size={12} color={colors.white} />
          <Text style={styles.aiBadgeText}>Powered by AI</Text>
        </LinearGradient>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
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
    color: "#667EEA",
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
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
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#8B9FEE",
    ...shadows.small,
  },
  quickQuestionText: {
    fontSize: 14,
    color: "#667EEA",
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
    color: "#667EEA",
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
    color: "#667EEA",
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
    backgroundColor: "#667EEA",
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
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(156, 39, 176, 0.2)",
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

  // AI Badge
  aiBadge: {
    position: "absolute",
    top: 110,
    right: 16,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  aiBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.white,
  },
});

export default AIChatScreen;
