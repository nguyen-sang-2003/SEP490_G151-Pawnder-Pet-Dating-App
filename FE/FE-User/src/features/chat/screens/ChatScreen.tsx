import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: any;
  isAI?: boolean;
}

const chatData: ChatItem[] = [
  {
    id: "ai",
    name: "AI Assistant",
    lastMessage: "Tôi có thể giúp gì cho bạn?",
    time: "Online",
    unread: 0,
    avatar: require("../../../assets/cat_avatar_signin.png"),
    isAI: true,
  },
  {
    id: "1",
    name: "Nguyễn Văn A",
    lastMessage: "Thú cưng của bạn rất dễ thương!",
    time: "10:30",
    unread: 2,
    avatar: require("../../../assets/cat_avatar.png"),
  },
  {
    id: "2",
    name: "Trần Thị B",
    lastMessage: "Cảm ơn bạn đã quan tâm 😊",
    time: "Yesterday",
    unread: 0,
    avatar: require("../../../assets/cat_avatar.png"),
  },
];

const ChatScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chatData.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatPress = (item: ChatItem) => {
    if (item.isAI) {
      navigation.navigate("AIChatList");
    } else {
      navigation.navigate("ChatDetail", {
        chatId: item.id,
        userName: item.name,
        userAvatar: item.avatar,
      });
    }
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.avatarWrapper}>
        <LinearGradient
          colors={item.isAI ? ["#667EEA", "#764BA2"] : gradients.primary}
          style={styles.avatarGradient}
        >
          <Image source={item.avatar} style={styles.avatar} />
        </LinearGradient>
        {item.isAI && (
          <View style={styles.aiBadge}>
            <Icon name="sparkles" size={12} color={colors.white} />
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textMedium} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textLabel}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="close-circle" size={20} color={colors.textMedium} />
          </TouchableOpacity>
        )}
      </View>

      {/* AI Chat Option - Highlighted */}
      <TouchableOpacity 
        style={styles.aiChatCard}
        onPress={() => navigation.navigate("AIChatList")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          style={styles.aiChatGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.aiChatIconContainer}>
            <Icon name="sparkles" size={24} color={colors.white} />
          </View>
          <View style={styles.aiChatContent}>
            <View style={styles.aiChatText}>
              <Text style={styles.aiChatTitle}>Chat with AI</Text>
              <Text style={styles.aiChatSubtitle}>
                Get instant pet care advice
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Chat List */}
      <View style={styles.chatListHeader}>
        <Text style={styles.sectionTitle}>Recent Chats</Text>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={64} color={colors.textLabel} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>
                Try searching for a different name or message
              </Text>
            </View>
          ) : null
        }
      />

      {/* Bottom Navigation */}
      <BottomNav active="Chat" />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    padding: 0,
  },

  // AI Chat Card
  aiChatCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  aiChatGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  aiChatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiChatContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiChatText: {
    flex: 1,
  },
  aiChatTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
  },
  aiChatSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },

  // Chat List
  chatListHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
  },

  // Chat Item
  chatItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: radius.md,
    ...shadows.small,
  },
  avatarWrapper: {
    marginRight: 12,
    position: "relative",
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  aiBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#9C27B0",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.whiteWarm,
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  chatTime: {
    fontSize: 12,
    color: colors.textMedium,
  },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.textMedium,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ChatScreen;

