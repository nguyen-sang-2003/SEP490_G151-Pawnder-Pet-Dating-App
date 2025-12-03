import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { chatExpertService } from '../../shared/api';
import { API_BASE_URL } from '../../shared/constants';
import './styles/ExpertChat.css';

// ============================================
// MOCK DATA - Đặt USE_MOCK_DATA = true để dùng mock data
// ============================================
// HƯỚNG DẪN:
// - Đặt USE_MOCK_DATA = true để hiển thị dữ liệu mẫu (không cần backend)
// - Đặt USE_MOCK_DATA = false để dùng API thật từ backend
// ============================================
const USE_MOCK_DATA = false; // Đổi thành false để dùng API thật

const MOCK_CHATS = [
  {
    chatExpertId: 1,
    expertId: 2,
    userId: 3,
    userName: 'Lê Minh C',
    userEmail: 'user1@pawnder.com',
    userAvatar: null,
    createdAt: '2025-11-20T10:00:00',
    updatedAt: '2025-11-21T14:30:00',
  },
  {
    chatExpertId: 2,
    expertId: 2,
    userId: 4,
    userName: 'Lê Minh D',
    userEmail: 'user2@pawnder.com',
    userAvatar: null,
    createdAt: '2025-11-20T11:00:00',
    updatedAt: '2025-11-21T15:00:00',
  },
];

const MOCK_MESSAGES = {
  1: [
    {
      contentId: 1,
      chatExpertId: 1,
      fromId: 3,
      message: 'Đã gửi file đoạn chat AI về tư vấn giống chó phù hợp',
      expertId: 2,
      userId: 3,
      chatAIId: 1,
      createdAt: '2025-11-20T10:00:00',
    },
    {
      contentId: 2,
      chatExpertId: 1,
      fromId: 3,
      message: 'Xin chào chuyên gia! Tôi đã xem qua câu trả lời từ AI về giống chó phù hợp. Tôi muốn hỏi thêm về chi phí nuôi Golden Retriever có đắt không ạ?',
      expertId: null,
      userId: null,
      chatAIId: null,
      createdAt: '2025-11-20T10:05:00',
    },
    {
      contentId: 3,
      chatExpertId: 1,
      fromId: 2,
      message: 'Chào bạn! Về chi phí nuôi Golden Retriever, tôi có thể chia sẻ như sau: Chi phí ban đầu (mua chó, vaccine, đồ dùng) khoảng 10-20 triệu. Chi phí hàng tháng: thức ăn (1-1.5 triệu), chăm sóc sức khỏe (200-500k), đồ chơi (100-300k). Tổng cộng khoảng 1.5-2.5 triệu/tháng.',
      expertId: 2,
      userId: 3,
      chatAIId: null,
      createdAt: '2025-11-20T10:10:00',
    },
    {
      contentId: 4,
      chatExpertId: 1,
      fromId: 3,
      message: 'Cảm ơn chuyên gia! Vậy Golden Retriever có dễ huấn luyện không? Tôi chưa có kinh nghiệm nuôi chó.',
      expertId: null,
      userId: null,
      chatAIId: null,
      createdAt: '2025-11-20T10:15:00',
    },
    {
      contentId: 5,
      chatExpertId: 1,
      fromId: 2,
      message: 'Golden Retriever rất thông minh và dễ huấn luyện! Chúng rất thích học hỏi và làm hài lòng chủ. Bạn nên bắt đầu huấn luyện từ khi còn nhỏ (2-3 tháng tuổi). Các lệnh cơ bản như ngồi, nằm, đến đây thường mất 1-2 tuần. Quan trọng là kiên nhẫn và dùng phần thưởng tích cực.',
      expertId: 2,
      userId: 3,
      chatAIId: null,
      createdAt: '2025-11-20T10:20:00',
    },
  ],
  2: [
    {
      contentId: 6,
      chatExpertId: 2,
      fromId: 4,
      message: 'Đã gửi file đoạn chat AI về phân tích gen thú cưng',
      expertId: 2,
      userId: 4,
      chatAIId: 2,
      createdAt: '2025-11-20T11:00:00',
    },
    {
      contentId: 7,
      chatExpertId: 2,
      fromId: 4,
      message: 'Chào chuyên gia! Tôi có câu hỏi về phân tích gen. Con chó của tôi là Poodle, tôi muốn biết có thể phối giống với giống nào để có đời con khỏe mạnh?',
      expertId: null,
      userId: null,
      chatAIId: null,
      createdAt: '2025-11-20T11:05:00',
    },
    {
      contentId: 8,
      chatExpertId: 2,
      fromId: 2,
      message: 'Chào bạn! Poodle có thể phối với nhiều giống khác nhau. Theo phân tích gen, Poodle phối với Labrador sẽ cho đời con khỏe mạnh và dễ huấn luyện (Labradoodle). Ngoài ra, Poodle cũng có thể phối với Golden Retriever (Goldendoodle) hoặc Cocker Spaniel (Cockapoo).',
      expertId: 2,
      userId: 4,
      chatAIId: null,
      createdAt: '2025-11-20T11:10:00',
    },
    {
      contentId: 9,
      chatExpertId: 2,
      fromId: 4,
      message: 'Vậy Labradoodle có đặc điểm gì nổi bật ạ?',
      expertId: null,
      userId: null,
      chatAIId: null,
      createdAt: '2025-11-20T11:15:00',
    },
    {
      contentId: 10,
      chatExpertId: 2,
      fromId: 2,
      message: 'Labradoodle là giống lai rất phổ biến! Đặc điểm nổi bật: ít rụng lông (từ Poodle), thông minh và thân thiện (từ Labrador), phù hợp với người bị dị ứng. Chúng rất năng động, thích chơi đùa và rất trung thành với chủ. Kích thước có thể từ nhỏ đến lớn tùy thuộc vào kích thước của Poodle bố mẹ.',
      expertId: 2,
      userId: 4,
      chatAIId: null,
      createdAt: '2025-11-20T11:20:00',
    },
  ],
};

const ExpertChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize SignalR connection
  useEffect(() => {
    // User object has 'id' field (from AuthContext)
    const userId = user?.id;
    if (!userId) {
      console.warn('⚠️ No userId available for SignalR');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️ No access token for SignalR');
      return;
    }

    let newConnection = null;

    // Import SignalR dynamically
    import('@microsoft/signalr').then(({ HubConnectionBuilder, LogLevel }) => {
      newConnection = new HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/chatHub`, {
          accessTokenFactory: () => token,
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      // Register handlers BEFORE starting connection
      newConnection.onclose(() => {
        console.log('SignalR connection closed');
      });

      newConnection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
      });

      newConnection.onreconnected(() => {
        console.log('SignalR reconnected');
        if (userId) {
          newConnection.invoke('RegisterUser', userId).catch(err => {
            console.error('Failed to register user on reconnect:', err);
          });
        }
      });

      // Listen for new expert messages
      newConnection.on('ReceiveExpertMessage', (messageData) => {
        console.log('📨 [SignalR] Received expert message:', messageData);
        
        const chatExpertId = messageData.ChatExpertId || messageData.chatExpertId;
        const fromId = messageData.FromId || messageData.fromId;
        const message = messageData.Message || messageData.message;
        const createdAt = messageData.CreatedAt || messageData.createdAt;
        
        console.log('📨 [SignalR] Parsed:', { chatExpertId, fromId, message, createdAt });
        
        // Use functional update to access latest selectedChat
        setSelectedChat((currentSelectedChat) => {
          console.log('📨 [SignalR] Current selected chat:', currentSelectedChat?.chatExpertId);
          console.log('📨 [SignalR] Message for chat:', chatExpertId);
          
          // Only add message if it's for the currently selected chat
          if (currentSelectedChat?.chatExpertId === chatExpertId) {
            setMessages((prev) => {
              // Check if message already exists (avoid duplicates)
              const exists = prev.some(m => {
                const sameContent = m.fromId === fromId && m.message === message;
                const sameTime = Math.abs(new Date(m.createdAt).getTime() - new Date(createdAt).getTime()) < 2000;
                return sameContent && sameTime;
              });
              
              if (exists) {
                console.log('⚠️ [SignalR] Message already exists, skipping');
                return prev;
              }
              
              const newMessage = {
                contentId: Date.now(),
                chatExpertId: chatExpertId,
                fromId: fromId,
                message: message,
                createdAt: createdAt
              };
              
              console.log('✅ [SignalR] Adding new message:', newMessage);
              return [...prev, newMessage];
            });
            
            setTimeout(() => scrollToBottom(), 100);
          } else {
            console.log('⚠️ [SignalR] Message is for different chat, ignoring for now');
            // TODO: Could show notification or update unread count here
          }
          
          // Return unchanged to not modify selectedChat
          return currentSelectedChat;
        });
      });

      // Start connection
      newConnection
        .start()
        .then(() => {
          console.log('✅ SignalR connected');
          if (userId) {
            return newConnection.invoke('RegisterUser', userId);
          }
        })
        .then(() => {
          console.log('✅ User registered with SignalR');
          setConnection(newConnection);
        })
        .catch((err) => {
          console.error('❌ SignalR connection error:', err);
        });
    });

    // Cleanup
    return () => {
      if (newConnection) {
        console.log('🔌 Disconnecting SignalR...');
        newConnection.stop().catch(err => {
          console.error('Error stopping SignalR:', err);
        });
      }
    };
  }, [user?.id]);

  // Load chats
  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading chats... USE_MOCK_DATA:', USE_MOCK_DATA);
        
        if (USE_MOCK_DATA) {
          // Sử dụng mock data - không cần user.UserId
          console.log('🎭 Using MOCK DATA for chats');
          console.log('📋 MOCK_CHATS:', MOCK_CHATS);
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
          console.log('✅ Mock chats loaded, count:', MOCK_CHATS.length);
          setChats(MOCK_CHATS);
          console.log('✅ State updated with chats:', MOCK_CHATS);
          if (MOCK_CHATS.length > 0) {
            console.log('✅ Setting selected chat to first item');
            setSelectedChat(MOCK_CHATS[0]);
          }
          setLoading(false);
          return;
        }

        // Sử dụng API thật - user.id from AuthContext
        const userId = user?.id;
        if (!userId) {
          console.warn('⚠️ No user ID available for API call');
          console.warn('⚠️ User object:', user);
          setLoading(false);
          return;
        }

        // Sử dụng API thật
        console.log('� ALoading chats for expert:', userId);
        console.log('👤 Current user object:', user);
        console.log('🔑 Access token:', localStorage.getItem('access_token') ? 'exists' : 'missing');
        
        const response = await chatExpertService.getChatsByExpertId(userId);
        console.log('📥 API Response (full):', JSON.stringify(response, null, 2));
        console.log('📥 API Response type:', typeof response);
        console.log('📥 API Response is array:', Array.isArray(response));
        
        const chatsData = Array.isArray(response) ? response : response?.data || [];
        console.log('💬 Chats data:', chatsData);
        
        if (chatsData.length === 0) {
          console.log('ℹ️ No chats found for this expert');
          setChats([]);
          setLoading(false);
          return;
        }
        
        // Backend đã trả về userName và userEmail, không cần fetch thêm
        const chatsWithUserInfo = chatsData.map((chat) => {
          const chatExpertId = chat.chatExpertId || chat.ChatExpertId;
          const userId = chat.userId || chat.UserId;
          
          return {
            chatExpertId: chatExpertId,
            expertId: chat.expertId || chat.ExpertId,
            userId: userId,
            userName: chat.userName || chat.UserName || `User #${userId}`,
            userEmail: chat.userEmail || chat.UserEmail || '',
            userAvatar: null, // Backend không trả avatar, có thể thêm sau
            createdAt: chat.createdAt || chat.CreatedAt,
            updatedAt: chat.updatedAt || chat.UpdatedAt,
          };
        });

        console.log('✅ Chats with user info:', chatsWithUserInfo);
        setChats(chatsWithUserInfo);
        
        // Auto-select first chat if available
        if (chatsWithUserInfo.length > 0 && !selectedChat) {
          setSelectedChat(chatsWithUserInfo[0]);
        }
      } catch (err) {
        console.error('❌ Failed to load chats:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChat?.chatExpertId) return;

    const loadMessages = async () => {
      try {
        if (USE_MOCK_DATA) {
          // Sử dụng mock data
          console.log('🎭 Using MOCK DATA for messages, chatExpertId:', selectedChat.chatExpertId);
          await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
          const mockMessages = MOCK_MESSAGES[selectedChat.chatExpertId] || [];
          setMessages(mockMessages);
          setTimeout(() => scrollToBottom(), 100);
          return;
        }

        // Sử dụng API thật
        console.log('📡 Loading messages for chatExpertId:', selectedChat.chatExpertId);
        const response = await chatExpertService.getMessages(selectedChat.chatExpertId);
        console.log('📥 Messages response:', response);
        const messagesData = Array.isArray(response) ? response : response?.data || [];
        console.log('💬 Messages data:', messagesData);
        setMessages(messagesData);
        setTimeout(() => scrollToBottom(), 100);
      } catch (err) {
        console.error('❌ Failed to load messages:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
      }
    };

    loadMessages();
  }, [selectedChat?.chatExpertId, user]);

  // Join SignalR group when connection is ready and chat is selected
  useEffect(() => {
    if (!selectedChat?.chatExpertId || !connection || !user?.id) return;

    const joinGroup = async () => {
      try {
        await connection.invoke('JoinExpertChat', selectedChat.chatExpertId, user.id);
        console.log('✅ Joined expert chat group:', selectedChat.chatExpertId);
      } catch (err) {
        console.warn('⚠️ Failed to join expert chat group:', err);
      }
    };

    joinGroup();

    // Leave group on cleanup
    return () => {
      if (connection && user?.id) {
        connection.invoke('LeaveExpertChat', selectedChat.chatExpertId, user.id).catch(err => {
          console.warn('⚠️ Failed to leave expert chat group:', err);
        });
      }
    };
  }, [selectedChat?.chatExpertId, connection, user?.id]);

  // Scroll to bottom when messages change or chat changes
  useEffect(() => {
    if (selectedChat?.chatExpertId && messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, selectedChat?.chatExpertId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    const messageText = newMessage.trim();
    const userId = user?.id;
    
    if (!userId) {
      console.error('❌ No userId available');
      alert('Không thể gửi tin nhắn. Vui lòng đăng nhập lại.');
      return;
    }

    setNewMessage('');
    setSending(true);

    try {
      if (USE_MOCK_DATA) {
        // Sử dụng mock data - chỉ thêm vào local state
        console.log('🎭 Using MOCK DATA for sending message');
        await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
        
        const newMsg = {
          contentId: Date.now(),
          chatExpertId: selectedChat.chatExpertId,
          fromId: userId,
          message: messageText,
          expertId: userId,
          userId: selectedChat.userId,
          chatAIId: null,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);
        scrollToBottom();
        setSending(false);
        return;
      }

      // Sử dụng API thật
      console.log('📤 Sending message:', {
        chatExpertId: selectedChat.chatExpertId,
        fromId: userId,
        message: messageText,
        expertId: userId,
        userId: selectedChat.userId,
      });
      
      const result = await chatExpertService.sendMessage(
        selectedChat.chatExpertId,
        userId,
        messageText,
        userId, // expertId
        selectedChat.userId, // userId
        null // chatAiId
      );

      console.log('✅ Message sent, result:', result);

      // Add message to state immediately (optimistic update)
      // SignalR will also broadcast it, but we'll handle duplicates
      const newMsg = {
        contentId: result?.contentId || Date.now(),
        chatExpertId: selectedChat.chatExpertId,
        fromId: userId,
        message: messageText,
        expertId: userId,
        userId: selectedChat.userId,
        chatAIId: null,
        createdAt: result?.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => {
        // Check if message already exists (from SignalR)
        const exists = prev.some(m => 
          m.contentId === newMsg.contentId || 
          (m.message === newMsg.message && 
           Math.abs(new Date(m.createdAt).getTime() - new Date(newMsg.createdAt).getTime()) < 2000)
        );
        
        if (exists) {
          console.log('⚠️ Message already exists, skipping optimistic update');
          return prev;
        }
        
        return [...prev, newMsg];
      });
      
      scrollToBottom();
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    // Backend trả về UTC, cần convert sang múi giờ Việt Nam (UTC+7)
    let date = new Date(dateString);
    
    // Nếu dateString không có timezone info, coi như UTC
    if (!dateString.includes('Z') && !dateString.includes('+')) {
      date = new Date(dateString + 'Z');
    }
    
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Backend trả về UTC, cần convert sang múi giờ Việt Nam (UTC+7)
    let date = new Date(dateString);
    
    // Nếu dateString không có timezone info, coi như UTC
    if (!dateString.includes('Z') && !dateString.includes('+')) {
      date = new Date(dateString + 'Z');
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // So sánh theo ngày ở múi giờ Việt Nam
    const dateVN = date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const todayVN = today.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const yesterdayVN = yesterday.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    if (dateVN === todayVN) {
      return 'Hôm nay';
    } else if (dateVN === yesterdayVN) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    }
  };

  if (loading) {
    return (
      <div className="expert-chat-page">
        <div className="loading">
          <p>Đang tải...</p>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            Đang tải danh sách chat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-chat-page">
      <div className="chat-container">
        {/* Chat List Sidebar */}
        <div className="chat-list-sidebar">
          <div className="chat-list-header">
            <h2>Chat với người dùng</h2>
            {USE_MOCK_DATA && (
              <div style={{ 
                fontSize: '11px', 
                color: '#ff9800', 
                marginTop: '4px',
                fontWeight: 'normal',
                fontStyle: 'italic'
              }}>
                🎭 Đang dùng Mock Data
              </div>
            )}
          </div>
          <div className="chat-list">
            {chats.length === 0 ? (
              <div className="empty-chat-list">
                <p>Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.chatExpertId}
                  className={`chat-item ${selectedChat?.chatExpertId === chat.chatExpertId ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-item-avatar">
                    {chat.userAvatar ? (
                      <img src={chat.userAvatar} alt={chat.userName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {chat.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-name">{chat.userName}</div>
                    <div className="chat-item-email">{chat.userEmail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-header-avatar">
                    {selectedChat.userAvatar ? (
                      <img src={selectedChat.userAvatar} alt={selectedChat.userName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {selectedChat.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="chat-header-name">{selectedChat.userName}</div>
                    <div className="chat-header-email">{selectedChat.userEmail}</div>
                  </div>
                </div>
              </div>

              <div className="chat-messages" ref={chatContainerRef}>
                {messages.map((msg, index) => {
                  // Xác định tin nhắn của expert: so sánh fromId với userId hiện tại
                  const currentUserId = user?.id;
                  const isExpert = msg.fromId === currentUserId;
                  
                  const showDate =
                    index === 0 ||
                    formatDate(messages[index - 1].createdAt) !== formatDate(msg.createdAt);

                  return (
                    <React.Fragment key={msg.contentId || index}>
                      {showDate && (
                        <div className="message-date-divider">
                          {formatDate(msg.createdAt)}
                        </div>
                      )}
                      <div className={`message ${isExpert ? 'message-sent' : 'message-received'}`}>
                        <div className="message-content">
                          <p>{msg.message}</p>
                          <span className="message-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="chat-send-button"
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? 'Đang gửi...' : 'Gửi'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertChat;

