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
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ExpertChat">;

interface Message {
  id: string;
  text: string;
  isExpert: boolean;
  timestamp: Date;
  status?: "sending" | "sent" | "failed";
}

const ExpertChatScreen = ({ navigation, route }: Props) => {
  const { expertId, expertName } = route.params || {};
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là chuyên gia thú y. Tôi đã xem câu hỏi của bạn về triệu chứng của mèo. Bạn có thể mô tả thêm chi tiết không?",
      isExpert: true,
      timestamp: new Date(Date.now() - 3600000),
      status: "sent",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (inputText.trim() === "") return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
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

    // TODO: Send message to API
    // Simulate sending
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "sent" } : msg
        )
      );
    }, 1000);
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
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
              <Text style={styles.expertBadgeText}>Chuyên gia</Text>
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
                color={item.isExpert ? "#81C784" : "#B39DDB"}
              />
            )}
          </View>
        </View>
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
                {expertName || "Chuyên gia thú y"}
              </Text>
              <View style={styles.expertStatusBadge}>
                <Icon name="shield-checkmark" size={12} color="#E8F5E9" />
                <Text style={styles.expertStatusText}>Đang hoạt động</Text>
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
        contentContainerStyle={styles.messagesList}
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
              placeholder="Nhắn tin với chuyên gia..."
              placeholderTextColor={colors.textLabel}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() === "" && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={inputText.trim() === ""}
            >
              <LinearGradient
                colors={
                  inputText.trim() === ""
                    ? ["#BDBDBD", "#9E9E9E"]
                    : ["#4CAF50", "#66BB6A"]
                }
                style={styles.sendButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="send" size={20} color={colors.white} />
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

