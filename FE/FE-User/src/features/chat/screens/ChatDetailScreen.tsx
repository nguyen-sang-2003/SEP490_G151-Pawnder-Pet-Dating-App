import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getChatMessages, sendMessage, deleteChat, ChatMessage, getChats, ChatUser } from "../api/chatApi";
import { blockUser } from "../../report/api/blockApi";
import { reportMessage } from "../../report/api/reportApi";
import { getUserById } from "../../profile/api/userApi";
import { getPetsByUserId, getPetById } from "../../pet/api/petApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import signalRService from "../../../services/signalr.service";
import { getUserPetAvatar, getPetAvatar } from "../../../utils/petAvatar";
import ReportMessageModal from "../../report/components/ReportMessageModal";
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../app/store';
import { markChatAsRead, setActiveViewingChatId } from '../../badge/badgeSlice';
import OptimizedImage from "../../../components/OptimizedImage";

const { width, height } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "ChatDetail">;

interface Message {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: Date;
  status?: "sending" | "sent" | "read";
  contentId?: number; // Backend ID for reporting
}

const ChatDetailScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { matchId, otherUserId, userName: initialUserName, userAvatar } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [myAvatar, setMyAvatar] = useState<any>(require("../../../assets/cat_avatar.png"));
  const [otherUserAvatar, setOtherUserAvatar] = useState<any>(require("../../../assets/cat_avatar.png"));
  const [userName, setUserName] = useState<string>(initialUserName || "Loading...");
  // Pet info for appointment
  const [myPetId, setMyPetId] = useState<number | null>(null);
  const [otherPetId, setOtherPetId] = useState<number | null>(null);
  const [myPetName, setMyPetName] = useState<string>("");
  const [otherPetName, setOtherPetName] = useState<string>("");
  const flatListRef = useRef<FlatList>(null);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserIdRef = useRef<number | null>(null);

  // Keep ref updated
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Auto scroll to bottom when messages change (nhận tin nhắn hoặc gửi tin nhắn)
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]); // Watch entire messages array, not just length

  // Fetch pet info if not provided (show pet name instead of owner name for privacy)
  useEffect(() => {
    const fetchPetInfo = async () => {
      if (!initialUserName || initialUserName === "Someone" || initialUserName === "undefined") {
        try {
          // Get chat info to find other pet ID
          const userIdStr = await AsyncStorage.getItem('userId');
          if (userIdStr) {
            const userId = parseInt(userIdStr);
            const chats = await getChats(userId);
            const currentChat = chats.find(c => c.matchId === matchId);
            
            if (currentChat) {
              const otherPetIdValue = currentChat.fromUserId === userId ? currentChat.toPetId : currentChat.fromPetId;
              
              // Fetch pet name using getPetById API
              if (otherPetIdValue) {
                const petData = await getPetById(otherPetIdValue);
                setUserName(petData.name || t('fallback.unknown'));
              } else {
                setUserName(t('fallback.unknown'));
              }
            }
          }
        } catch (error) {

          setUserName(t('fallback.unknown'));
        }
      }
    };

    fetchPetInfo();
  }, [otherUserId, initialUserName, matchId]);

  // Typing animation
  const typingAnim1 = useRef(new Animated.Value(0)).current;
  const typingAnim2 = useRef(new Animated.Value(0)).current;
  const typingAnim3 = useRef(new Animated.Value(0)).current;

  // Animate typing dots
  useEffect(() => {
    if (isTyping) {
      const createAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createAnimation(typingAnim1, 0);
      const anim2 = createAnimation(typingAnim2, 200);
      const anim3 = createAnimation(typingAnim3, 400);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    }
  }, [isTyping]);

  // Setup SignalR connection and listeners
  useEffect(() => {
    setupSignalR();

    return () => {
      cleanupSignalR();
    };
  }, [matchId]);

  // Load messages when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      dispatch(setActiveViewingChatId(matchId));
      
      loadMessages();
      dispatch(markChatAsRead(matchId));
      
      return () => {
        dispatch(setActiveViewingChatId(null));
      };
    }, [matchId, dispatch])
  );

  const setupSignalR = async () => {
    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        return;
      }

      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);

      if (!signalRService.isConnected()) {
        await signalRService.connect(userId);
      }

      await signalRService.joinChat(matchId, userId);

      signalRService.on('ReceiveMessage', handleReceiveMessage);
      signalRService.on('UserTyping', handleUserTyping);
      signalRService.on('UserOnline', handleUserOnline);
      signalRService.on('UserOffline', handleUserOffline);
      signalRService.on('UserJoinedChat', handleUserJoinedChat);

      const isOnline = await signalRService.isUserOnline(otherUserId);
      setOtherUserOnline(isOnline);
    } catch (error) {

    }
  };

  const cleanupSignalR = async () => {
    try {
      if (currentUserId) {
        await signalRService.leaveChat(matchId, currentUserId);
      }

      signalRService.off('ReceiveMessage', handleReceiveMessage);
      signalRService.off('UserTyping', handleUserTyping);
      signalRService.off('UserOnline', handleUserOnline);
      signalRService.off('UserOffline', handleUserOffline);
      signalRService.off('UserJoinedChat', handleUserJoinedChat);
    } catch (error) {

    }
  };

  const handleReceiveMessage = (data: any) => {
    const fromUserId = data.fromUserId || data.FromUserId;
    const messageText = data.message || data.Message;
    let createdAt = data.createdAt || data.CreatedAt;

    if (typeof createdAt === 'string' && !createdAt.endsWith('Z') && !createdAt.includes('+')) {
      createdAt = createdAt + 'Z';
    }

    const isFromMe = currentUserIdRef.current && fromUserId === currentUserIdRef.current;
    const timestamp = new Date(createdAt);

    if (!isFromMe) {
      dispatch(markChatAsRead(matchId));
    }

    setMessages(prev => {
      // For my own messages: find by status "sending" or "sent" within time window
      // The text might be different due to bad word filtering
      if (isFromMe) {
        const recentSendingMsg = prev.find(msg =>
          msg.isMe &&
          (msg.status === "sending" || msg.status === "sent") &&
          Math.abs(timestamp.getTime() - msg.timestamp.getTime()) < 30000 // 30 second window
        );

        if (recentSendingMsg) {
          return prev.map(msg =>
            msg.id === recentSendingMsg.id
              ? { 
                  ...msg, 
                  text: messageText, // Update with filtered message from backend
                  status: "sent" as const 
                }
              : msg
          );
        }
        return prev;
      }

      // For other user's messages: check for duplicates
      const existingMsg = prev.find(msg =>
        msg.text === messageText &&
        Math.abs(timestamp.getTime() - msg.timestamp.getTime()) < 10000
      );

      if (existingMsg) {
        return prev;
      }

      // Add new message from other user
      const newMessage: Message = {
        id: `signalr_${fromUserId}_${Date.now()}`,
        text: messageText,
        isMe: false,
        timestamp: timestamp,
        status: "read" as const,
      };

      return [...prev, newMessage];
    });

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleUserTyping = (data: any) => {
    const userId = data.userId || data.UserId;
    const isTyping = data.isTyping !== undefined ? data.isTyping : data.IsTyping;

    if (userId === otherUserId) {
      setIsTyping(isTyping);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    }
  };

  const handleUserOnline = (userId: number) => {
    if (userId === otherUserId) {
      setOtherUserOnline(true);
    }
  };

  const handleUserOffline = (userId: number) => {
    if (userId === otherUserId) {
      setOtherUserOnline(false);
    }
  };

  const handleUserJoinedChat = (data: any) => {
    if (data.userId === otherUserId && data.matchId === matchId) {
      setOtherUserOnline(true);
    }
  };

  // Load messages with pagination and parallel loading
  const loadMessages = async () => {
    try {
      setLoading(true);

      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        return;
      }

      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);

      const [chats, chatMessages] = await Promise.all([
        getChats(userId),
        getChatMessages(matchId)
      ]);
      
      const currentMatch = chats.find((chat: ChatUser) => chat.matchId === matchId);
      
      if (currentMatch) {
        const myPetIdValue = currentMatch.fromUserId === userId ? currentMatch.fromPetId : currentMatch.toPetId;
        const otherPetIdValue = currentMatch.fromUserId === userId ? currentMatch.toPetId : currentMatch.fromPetId;

        // Save pet IDs for appointment feature
        if (myPetIdValue) setMyPetId(myPetIdValue);
        if (otherPetIdValue) setOtherPetId(otherPetIdValue);

        // Fetch pet names for appointment
        if (myPetIdValue) {
          getPetById(myPetIdValue)
            .then(pet => setMyPetName(pet.name || pet.Name || ''))
            .catch(() => {});
        }
        if (otherPetIdValue) {
          getPetById(otherPetIdValue)
            .then(pet => setOtherPetName(pet.name || pet.Name || ''))
            .catch(() => {});
        }

        const myAvatarResult = myPetIdValue 
          ? await getPetAvatar(myPetIdValue).catch(() => getUserPetAvatar(userId))
          : await getUserPetAvatar(userId);
        
        setMyAvatar(myAvatarResult);

        if (otherPetIdValue) {
          getPetAvatar(otherPetIdValue)
            .then(otherAvatar => {
              setOtherUserAvatar(otherAvatar);
            })
            .catch(() => {
              getUserPetAvatar(otherUserId)
                .then(otherAvatar => {
                  setOtherUserAvatar(otherAvatar);
                })
                .catch(() => {
                  setOtherUserAvatar(require("../../../assets/cat_avatar.png"));
                });
            });
        } else {
          getUserPetAvatar(otherUserId)
            .then(otherAvatar => {
              setOtherUserAvatar(otherAvatar);
            })
            .catch(() => {
              setOtherUserAvatar(require("../../../assets/cat_avatar.png"));
            });
        }
      } else {
        const avatar = await getUserPetAvatar(userId);
        setMyAvatar(avatar);
        
        getUserPetAvatar(otherUserId)
          .then(otherAvatar => {
            setOtherUserAvatar(otherAvatar);
          })
          .catch(() => {
            setOtherUserAvatar(require("../../../assets/cat_avatar.png"));
          });
      }

      const INITIAL_MESSAGE_COUNT = 50;
      const messagesToShow = chatMessages.slice(-INITIAL_MESSAGE_COUNT);

      const formattedMessages: Message[] = messagesToShow.map((msg) => {
        let dateString = msg.createdAt;
        if (!dateString.endsWith('Z') && !dateString.includes('+')) {
          dateString = dateString + 'Z';
        }

        return {
          id: msg.contentId.toString(),
          text: msg.message,
          isMe: msg.fromUserId === userId,
          timestamp: new Date(dateString),
          status: "read" as const,
          contentId: msg.contentId,
        };
      });

      setMessages(formattedMessages);

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      });

    } catch (error: any) {

      showAlert({ type: 'error', title: t('common.error'), message: t('chat.detail.loadError') });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentUserId || sending) return;

    const messageText = inputText.trim();
    const tempId = Date.now().toString();

    const newMessage: Message = {
      id: tempId,
      text: messageText,
      isMe: true,
      timestamp: new Date(),
      status: "sending",
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    signalRService.sendTyping(matchId, currentUserId, false);

    try {
      setSending(true);

      const response = await sendMessage(matchId, currentUserId, messageText);

      // Update message with filtered text from backend (if bad words were masked)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { 
                ...msg,
                text: response.message, // Use filtered message from backend
                status: "sent" as const,
                contentId: response.contentId,
              }
            : msg
        )
      );

    } catch (error: any) {

      setMessages(prev => prev.filter(msg => msg.id !== tempId));

      // Check if it's a bad word filter error
      const errorMessage = error.message || '';
      const isBadWordError = errorMessage.includes('nội dung không phù hợp') || 
                             errorMessage.includes('Tin nhắn của bạn chứa nội dung không phù hợp');

      if (isBadWordError) {
        // Show bad word warning alert - don't restore message to input
        showAlert({
          type: 'warning',
          title: t('chat.badWord.title'),
          message: t('chat.badWord.message'),
        });
      } else {
        // Show regular error with retry option
        showAlert({
          type: 'error',
          title: t('chat.detail.sendErrorTitle'),
          message: error.message || t('chat.detail.sendError'),
          showCancel: true,
          confirmText: t('chat.detail.retryButton'),
          onConfirm: () => setInputText(messageText),
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!currentUserId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (text.trim().length > 0) {
      signalRService.sendTyping(matchId, currentUserId, true);

      typingTimeoutRef.current = setTimeout(() => {
        signalRService.sendTyping(matchId, currentUserId, false);
      }, 2000);
    } else {
      signalRService.sendTyping(matchId, currentUserId, false);
    }
  };

  const handleMenuPress = () => {
    setShowMenuModal(true);
  };

  const handleCreateAppointment = () => {
    if (!myPetId || !otherPetId) {
      showAlert({
        type: 'warning',
        title: t('common.error'),
        message: t('chat.appointment.noPetInfo') || 'Không tìm thấy thông tin thú cưng',
      });
      return;
    }
    navigation.navigate('CreateAppointment', {
      matchId,
      inviterPetId: myPetId,
      inviteePetId: otherPetId,
      inviterPetName: myPetName || t('fallback.unknown'),
      inviteePetName: otherPetName || t('fallback.unknown'),
    });
  };

  const closeMenu = () => {
    setShowMenuModal(false);
  };

  const handleViewProfile = async () => {
    closeMenu();

    try {
      const pets = await getPetsByUserId(otherUserId);

      if (!pets || pets.length === 0) {
        showAlert({
          type: 'info',
          title: t('alerts.info'),
          message: t('chat.profile.noPetInfo')
        });
        return;
      }

      const firstPet = pets[0];
      const petId = firstPet.petId || firstPet.PetId;
      const petName = firstPet.name || firstPet.Name || t('fallback.unknown');

      if (!petId) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('chat.profile.petNotFound')
        });
        return;
      }

      navigation.navigate('PetProfile' as any, {
        petId: petId.toString(),
        fromChat: true
      });

    } catch (error: any) {

      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('chat.profile.loadError')
      });
    }
  };

  const handleUnmatch = async () => {
    closeMenu();
    showAlert({
      type: 'warning',
      title: t('chat.unmatch.title'),
      message: t('chat.unmatch.message', { name: userName }),
      showCancel: true,
      confirmText: t('common.confirm'),
      onConfirm: async () => {
        try {
          await deleteChat(matchId);

          dispatch(markChatAsRead(matchId));

          // Navigate về ChatList ngay lập tức
          navigation.reset({
            index: 0,
            routes: [{ name: 'Chat' }],
          });

          // Hiển thị thông báo success sau khi đã navigate
          showAlert({
            type: 'success',
            title: t('chat.unmatch.success'),
            message: t('chat.unmatch.successMessage', { name: userName }),
          });
        } catch (error: any) {

          showAlert({ type: 'error', title: t('common.error'), message: error.message || t('chat.detail.sendError') });
        }
      },
    });
  };

  const handleReportMessage = () => {
    if (!selectedMessage || !selectedMessage.contentId || !currentUserId) return;

    setShowMessageMenu(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async (reason: string) => {
    if (!selectedMessage || !selectedMessage.contentId || !currentUserId) return;

    setShowReportModal(false);

    try {
      await reportMessage(currentUserId, selectedMessage.contentId!, reason);

      showAlert({
        type: 'success',
        title: t('chat.report.success'),
        message: t('chat.report.successMessage', { name: userName }),
        onClose: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Chat' }],
          });
        },
      });
    } catch (error: any) {

      showAlert({ type: 'error', title: t('common.error'), message: error.message || t('chat.expert.submitError') });
    }
  };

  const handleBlock = () => {
    closeMenu();
    showAlert({
      type: 'warning',
      title: t('chat.block.title'),
      message: t('chat.block.message', { name: userName }),
      showCancel: true,
      confirmText: t('chat.menu.block'),
      onConfirm: async () => {
        try {
          const currentUserIdStr = await AsyncStorage.getItem('userId');
          if (!currentUserIdStr) {
            showAlert({ type: 'error', title: t('common.error'), message: t('chat.aiList.userNotFound') });
            return;
          }
          const currentUserId = parseInt(currentUserIdStr, 10);

          await blockUser(currentUserId, otherUserId);

          showAlert({
            type: 'success',
            title: t('chat.block.success'),
            message: t('chat.block.successMessage', { name: userName }),
            onClose: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Chat' }],
              });
            },
          });
        } catch (error: any) {

          showAlert({ type: 'error', title: t('common.error'), message: t('chat.detail.sendError') });
        }
      },
    });
  };

  // Dating app style time formatting
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return t('chat.detail.today');
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return t('chat.detail.yesterday');
    } else {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;

    const currentDate = new Date(currentMsg.timestamp);
    const prevDate = new Date(prevMsg.timestamp);

    currentDate.setHours(0, 0, 0, 0);
    prevDate.setHours(0, 0, 0, 0);

    return currentDate.getTime() !== prevDate.getTime();
  };

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

    // Messenger style: show avatar for each message
    // Group consecutive messages from same person
    const isFirstInGroup = !prevMessage || prevMessage.isMe !== item.isMe;
    const isLastInGroup = !nextMessage || nextMessage.isMe !== item.isMe;
    const showDateSeparator = shouldShowDateSeparator(item, prevMessage);

    return (
      <View>
        {/* Date Separator */}
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.timestamp)}
            </Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}

        <View
          style={[
            styles.messageContainer,
            item.isMe ? styles.myMessage : styles.theirMessage,
            !isFirstInGroup && styles.messageGrouped,
            isLastInGroup && styles.messageLastInGroup,
          ]}
        >
          {/* Avatar - Messenger style (show for last message in group) */}
          {!item.isMe && isLastInGroup && (
            <OptimizedImage source={otherUserAvatar} style={styles.messageAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
          )}
          {!item.isMe && !isLastInGroup && (
            <View style={styles.messageAvatarPlaceholder} />
          )}

          <View style={styles.messageBubbleWrapper}>
            <View
              style={[
                styles.messageBubble,
                item.isMe ? styles.myBubble : styles.theirBubble,
                !isFirstInGroup && (item.isMe ? styles.myBubbleGrouped : styles.theirBubbleGrouped),
                isLastInGroup && (item.isMe ? styles.myBubbleLastInGroup : styles.theirBubbleLastInGroup),
              ]}
            >
              {item.isMe ? (
                <LinearGradient
                  colors={gradients.chat}
                  style={styles.myBubbleGradient}
                >
                  <Text style={styles.myMessageText}>{item.text}</Text>
                </LinearGradient>
              ) : (
                <Pressable
                  onLongPress={() => {
                    setSelectedMessage(item);
                    setShowMessageMenu(true);
                  }}
                  style={styles.theirBubbleContent}
                >
                  <Text style={styles.theirMessageText}>{item.text}</Text>
                </Pressable>
              )}
            </View>

            {/* Time & Status - Show for last message in group */}
            {isLastInGroup && (
              <View style={[styles.messageTimeContainer, item.isMe && styles.myMessageTimeContainer]}>
                <Text style={styles.messageTimeText}>
                  {formatMessageTime(item.timestamp)}
                </Text>
                {item.isMe && item.status && (
                  <View style={styles.messageStatusIcon}>
                    {item.status === "sending" && (
                      <Icon name="time-outline" size={14} color={colors.textLabel} />
                    )}
                    {item.status === "sent" && (
                      <Icon name="checkmark" size={14} color={colors.textLabel} />
                    )}
                    {item.status === "read" && (
                      <Icon name="checkmark-done" size={14} color={colors.primary} />
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Avatar for my messages - Messenger style */}
          {item.isMe && isLastInGroup && (
            <OptimizedImage source={myAvatar} style={styles.messageAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
          )}
          {item.isMe && !isLastInGroup && (
            <View style={styles.messageAvatarPlaceholder} />
          )}
        </View>
      </View>
    );
  }, [messages, otherUserAvatar, myAvatar]);

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
            <OptimizedImage source={otherUserAvatar} style={styles.headerAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{userName}</Text>
              <Text style={styles.headerStatus}>
                {isTyping ? t('chat.detail.typing') : otherUserOnline ? t('chat.detail.online') : t('chat.detail.offline')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.appointmentButton}
            onPress={handleCreateAppointment}
          >
            <Icon name="calendar-outline" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
          >
            <Icon name="ellipsis-vertical" size={24} color={colors.textDark} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={64} color={colors.textLabel} />
            <Text style={styles.emptyTitle}>{t('chat.noChats')}</Text>
            <Text style={styles.emptyText}>{t('chat.startConversation')}</Text>
          </View>
        ) : (
          /* Messages */
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={20}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate message height
              offset: 80 * index,
              index,
            })}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingIndicator}>
                  <OptimizedImage source={otherUserAvatar} style={styles.messageAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
                  <View style={styles.typingBubble}>
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                          transform: [{
                            translateY: typingAnim1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -4],
                            }),
                          }],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        { marginLeft: 4 },
                        {
                          opacity: typingAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                          transform: [{
                            translateY: typingAnim2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -4],
                            }),
                          }],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        { marginLeft: 4 },
                        {
                          opacity: typingAnim3.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                          transform: [{
                            translateY: typingAnim3.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -4],
                            }),
                          }],
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="add-circle-outline" size={28} color={colors.primary} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder={t('chat.detail.inputPlaceholder')}
              placeholderTextColor={colors.textLabel}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <LinearGradient
                colors={inputText.trim() && !sending ? gradients.chat : ["#E0E0E0", "#BDBDBD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendGradient}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon
                    name="send"
                    size={20}
                    color={colors.white}
                  />
                )}
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
              <OptimizedImage source={otherUserAvatar} style={styles.menuAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuUserName}>{userName}</Text>
                <Text style={styles.menuUserStatus}>{t('chat.detail.online')}</Text>
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
                  <Text style={styles.menuOptionTitle}>{t('chat.menu.viewProfile')}</Text>
                  <Text style={styles.menuOptionDesc}>{t('chat.profile.noPetInfo')}</Text>
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
                  <Text style={styles.menuOptionTitle}>{t('chat.menu.unmatch')}</Text>
                  <Text style={styles.menuOptionDesc}>{t('chat.unmatch.title')}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>

              {/* Block */}
              <TouchableOpacity style={styles.menuOption} onPress={handleBlock}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#FFEBEE" }]}>
                  <Icon name="ban-outline" size={22} color="#E94D6B" />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={[styles.menuOptionTitle, { color: "#E94D6B" }]}>{t('chat.menu.block')}</Text>
                  <Text style={styles.menuOptionDesc}>{t('chat.block.title')}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Message Menu Modal - For reporting messages */}
      <Modal
        visible={showMessageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMessageMenu(false)}>
          <Pressable style={styles.messageMenuModal} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity style={styles.menuOption} onPress={handleReportMessage}>
              <View style={[styles.menuIconContainer, { backgroundColor: "#FFEBEE" }]}>
                <Icon name="flag" size={22} color="#E94D6B" />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={[styles.menuOptionTitle, { color: "#E94D6B" }]}>{t('chat.report.title')}</Text>
                <Text style={styles.menuOptionDesc}>{t('chat.menu.report')}</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          onClose={hideAlert}
          onConfirm={alertConfig.onConfirm}
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel}
        />
      )}

      {/* Report Message Modal */}
      <ReportMessageModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleSubmitReport}
        userName={userName}
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
  appointmentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    ...shadows.small,
  },

  // Messages - Dating App Style
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },

  // Date Separator
  dateSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.textLabel,
    opacity: 0.2,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    backgroundColor: colors.textMedium,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },

  // Message Container - Messenger style with avatars
  messageContainer: {
    flexDirection: "row",
    marginBottom: 2,
    paddingHorizontal: 4,
    alignItems: "flex-end",
  },
  messageGrouped: {
    marginBottom: 2,
  },
  messageLastInGroup: {
    marginBottom: 12,
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  theirMessage: {
    justifyContent: "flex-start",
  },

  // Avatar - Messenger style
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 6,
  },
  messageAvatarPlaceholder: {
    width: 28,
    marginHorizontal: 6,
  },

  // Message Bubble Wrapper
  messageBubbleWrapper: {
    flexDirection: "column",
    maxWidth: width * 0.65,
  },

  // Message Bubble
  messageBubble: {
    maxWidth: "100%",
  },
  myBubble: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  myBubbleGrouped: {
    borderRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 4,
  },
  myBubbleLastInGroup: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  theirBubbleGrouped: {
    borderRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 4,
  },
  theirBubbleLastInGroup: {
    borderBottomLeftRadius: 4,
  },
  myBubbleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  theirBubbleContent: {
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    ...shadows.small,
  },
  myMessageText: {
    fontSize: 16,
    color: colors.white,
    lineHeight: 22,
  },
  theirMessageText: {
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 22,
  },

  // Time & Status - Dating app style
  messageTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginHorizontal: 8,
  },
  myMessageTimeContainer: {
    justifyContent: "flex-end",
  },
  messageTimeText: {
    fontSize: 11,
    color: colors.textLabel,
    marginRight: 4,
  },
  messageStatusIcon: {
    marginLeft: 2,
  },

  // Typing Indicator - Dating app style (no avatar)
  typingIndicator: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
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

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 12,
  },
  emptyContainer: {
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
  messageMenuModal: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    marginHorizontal: 20,
    padding: 8,
    ...shadows.large,
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

