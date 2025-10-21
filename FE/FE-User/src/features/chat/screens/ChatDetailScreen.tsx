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
  Image,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "ChatDetail">;

interface Message {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: Date;
  status?: "sending" | "sent" | "read";
}

const ChatDetailScreen = ({ navigation, route }: Props) => {
  const { chatId, userName, userAvatar } = route.params;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! Your pet is so adorable! 🐱",
      isMe: false,
      timestamp: new Date(Date.now() - 3600000),
      status: "read",
    },
    {
      id: "2",
      text: "Thank you so much! Your furry friend looks amazing too! 😊",
      isMe: true,
      timestamp: new Date(Date.now() - 3500000),
      status: "read",
    },
    {
      id: "3",
      text: "Would you like to arrange a playdate for them?",
      isMe: false,
      timestamp: new Date(Date.now() - 1800000),
      status: "read",
    },
    {
      id: "4",
      text: "That sounds wonderful! When are you available?",
      isMe: true,
      timestamp: new Date(Date.now() - 900000),
      status: "read",
    },
  ]);
  
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Simulate other user typing
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
    }, 3000);

    return () => clearTimeout(typingTimer);
  }, [isTyping]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isMe: true,
        timestamp: new Date(),
        status: "sending",
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText("");
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Simulate message sent
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: "sent" as const }
              : msg
          )
        );
      }, 1000);

      // Simulate other user typing
      setTimeout(() => {
        setIsTyping(true);
      }, 2000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !item.isMe && (!prevMessage || prevMessage.isMe);
    const showTimestamp = index === 0 || 
      (item.timestamp.getTime() - (prevMessage?.timestamp?.getTime() || 0)) > 300000;

    return (
      <View>
        {showTimestamp && (
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        )}
        
        <View
          style={[
            styles.messageContainer,
            item.isMe ? styles.myMessage : styles.theirMessage,
          ]}
        >
          {!item.isMe && (
            <View style={styles.avatarContainer}>
              {showAvatar ? (
                <Image source={userAvatar} style={styles.messageAvatar} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </View>
          )}
          
          <View
            style={[
              styles.messageBubble,
              item.isMe ? styles.myBubble : styles.theirBubble,
            ]}
          >
            {item.isMe ? (
              <LinearGradient
                colors={gradients.primary}
                style={styles.myBubbleGradient}
              >
                <Text style={styles.myMessageText}>{item.text}</Text>
                {item.status && (
                  <View style={styles.messageStatus}>
                    {item.status === "sending" && (
                      <Icon name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                    )}
                    {item.status === "sent" && (
                      <Icon name="checkmark" size={12} color="rgba(255,255,255,0.7)" />
                    )}
                    {item.status === "read" && (
                      <Icon name="checkmark-done" size={12} color="rgba(255,255,255,0.9)" />
                    )}
                  </View>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.theirBubbleContent}>
                <Text style={styles.theirMessageText}>{item.text}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

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
          <Image source={userAvatar} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? "typing..." : "Active now"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Icon name="ellipsis-vertical" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

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
            <Image source={userAvatar} style={styles.typingAvatar} />
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
              <Icon name="add-circle-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textLabel}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? gradients.primary : ["#DDD", "#CCC"]}
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
    backgroundColor: "transparent",
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: colors.primary,
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

  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  timestampContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  timestampText: {
    fontSize: 12,
    color: colors.textMedium,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  theirMessage: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    width: 32,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    borderRadius: radius.lg,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  myBubbleGradient: {
    padding: 12,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  theirBubbleContent: {
    backgroundColor: colors.whiteWarm,
    padding: 12,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    ...shadows.small,
  },
  myMessageText: {
    fontSize: 15,
    color: colors.white,
    lineHeight: 22,
  },
  theirMessageText: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },
  messageStatus: {
    alignSelf: "flex-end",
    marginTop: 4,
  },

  // Typing Indicator
  typingIndicator: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    backgroundColor: colors.textMedium,
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
});

export default ChatDetailScreen;

