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
  Alert,
  Modal,
  Pressable,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

const { width, height } = Dimensions.get("window");

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
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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

  const handleMenuPress = () => {
    setShowMenuModal(true);
  };

  const closeMenu = () => {
    setShowMenuModal(false);
  };

  const handleViewProfile = () => {
    closeMenu();
    // Navigate to user's pet profile
    navigation.navigate("PetProfile", { petId: chatId });
  };

  const handleUnmatch = () => {
    closeMenu();
    Alert.alert(
      "Unmatch",
      `Are you sure you want to unmatch with ${userName}? This will delete the conversation and you won't be able to message each other.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: () => {
            // TODO: Call Unmatch API - DELETE /chatuser/chat/{matchId}
            console.log("Unmatched:", chatId);
            Alert.alert("Unmatched", `You've unmatched with ${userName}`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    closeMenu();
    // Navigate to Report screen
    navigation.navigate("Report" as any, { 
      userId: chatId, 
      userName: userName 
    });
  };

  const handleBlock = () => {
    closeMenu();
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${userName}? You won't be able to message each other.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            // TODO: Call Block API - POST /block/{fromUserId}/{toUserId}
            console.log("Blocked user:", chatId);
            Alert.alert("Blocked", `${userName} has been blocked.`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDeleteChat = () => {
    closeMenu();
    Alert.alert(
      "Delete Conversation",
      `Delete your conversation with ${userName}? You will still be matched and can start a new chat. To remove the match completely, use Unmatch instead.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Call Delete Chat API - DELETE /chat-user-content/{matchId}
            console.log("Deleted conversation:", chatId);
            setMessages([]);
            Alert.alert("Deleted", "Conversation has been deleted. You're still matched.");
            navigation.goBack();
          },
        },
      ]
    );
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

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={handleMenuPress}
        >
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

      {/* Menu Modal - Bottom Sheet Style */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <Pressable style={styles.menuModal} onPress={(e) => e.stopPropagation()}>
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <Image source={userAvatar} style={styles.menuAvatar} />
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuUserName}>{userName}</Text>
                <Text style={styles.menuUserStatus}>Active now</Text>
              </View>
              <TouchableOpacity onPress={closeMenu} style={styles.menuCloseBtn}>
                <Icon name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Menu Options */}
            <View style={styles.menuOptions}>
              {/* View Full Profile */}
              <TouchableOpacity style={styles.menuOption} onPress={handleViewProfile}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#FFE8F5" }]}>
                  <Icon name="person-circle-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={styles.menuOptionTitle}>View Full Profile</Text>
                  <Text style={styles.menuOptionDesc}>See all pet photos & details</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Unmatch */}
              <TouchableOpacity style={styles.menuOption} onPress={handleUnmatch}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#FFF8E1" }]}>
                  <Icon name="heart-dislike-outline" size={22} color="#FFA726" />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={styles.menuOptionTitle}>Unmatch</Text>
                  <Text style={styles.menuOptionDesc}>Remove this match</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>

              {/* Report */}
              <TouchableOpacity style={styles.menuOption} onPress={handleReport}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#FFF3E0" }]}>
                  <Icon name="flag-outline" size={22} color="#FF9800" />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={styles.menuOptionTitle}>Report</Text>
                  <Text style={styles.menuOptionDesc}>Report inappropriate behavior</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>

              {/* Block */}
              <TouchableOpacity style={styles.menuOption} onPress={handleBlock}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#FFEBEE" }]}>
                  <Icon name="ban-outline" size={22} color="#E94D6B" />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={[styles.menuOptionTitle, { color: "#E94D6B" }]}>Block</Text>
                  <Text style={styles.menuOptionDesc}>Block this user</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Delete Conversation */}
              <TouchableOpacity style={styles.menuOption} onPress={handleDeleteChat}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#F5F5F5" }]}>
                  <Icon name="trash-outline" size={22} color={colors.error} />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={[styles.menuOptionTitle, { color: colors.error }]}>Delete Conversation</Text>
                  <Text style={styles.menuOptionDesc}>Clear all messages</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuModal: {
    backgroundColor: colors.whiteWarm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: Dimensions.get("window").height * 0.75,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  menuHeaderText: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
  menuUserStatus: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  menuCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  menuOptions: {
    paddingVertical: 8,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuOptionText: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  menuOptionDesc: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
    marginHorizontal: 20,
  },
});

export default ChatDetailScreen;

