import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { chatAIService } from '../../shared/api';
import './styles/ExpertChatAI.css';

/**
 * Loại bỏ markdown formatting từ text AI response
 */
const stripMarkdown = (text) => {
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

const ExpertChatAI = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const messagesEndRef = useRef(null);
  const clonedChatIdRef = useRef(searchParams.get('clonedChatId'));

  // Load all chats for the expert
  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true);
        const userId = user?.id;
        if (!userId) {
          console.warn('⚠️ No user ID available for API call');
          setLoading(false);
          return;
        }

        console.log('🔄 Loading AI chats for expert:', userId);
        const response = await chatAIService.getAllChats(userId);
        console.log('📥 API Response:', response);
        
        // Backend returns: { success: true, data: [...] }
        const chatsData = response?.data || [];
        console.log('💬 Chats data:', chatsData);

        // Map to consistent format
        // Backend returns: { ChatAiid, Title, CreatedAt, UpdatedAt, MessageCount, LastQuestion }
        const mappedChats = chatsData.map((chat) => {
          const chatAiId = chat.chatAiId || chat.ChatAiId || chat.ChatAiid || chat.chatAiid;
          if (!chatAiId) {
            console.warn('⚠️ Chat missing chatAiId:', chat);
          }
          return {
            chatAiId: chatAiId,
            userId: chat.userId || chat.UserId,
            title: chat.title || chat.Title || `Chat ${chatAiId || 'Unknown'}`,
            createdAt: chat.createdAt || chat.CreatedAt,
            updatedAt: chat.updatedAt || chat.UpdatedAt,
          };
        }).filter(chat => chat.chatAiId); // Filter out chats without chatAiId

        // Sort by updatedAt (newest first)
        const sortedChats = mappedChats.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        console.log('✅ Chats loaded:', sortedChats);
        setChats(sortedChats);

        // Check if we have a clonedChatId to auto-select
        const clonedChatId = clonedChatIdRef.current;
        if (clonedChatId) {
          console.log('🔍 Looking for cloned chat with ID:', clonedChatId);
          const clonedChat = sortedChats.find(
            (chat) => chat.chatAiId === parseInt(clonedChatId) || chat.chatAiId === clonedChatId
          );
          if (clonedChat) {
            console.log('✅ Found cloned chat, auto-selecting:', clonedChat);
            setSelectedChat(clonedChat);
            // Clear the query param to avoid re-triggering
            setSearchParams({}, { replace: true });
            clonedChatIdRef.current = null;
          } else {
            console.warn('⚠️ Cloned chat not found, selecting first chat');
            if (sortedChats.length > 0) {
              setSelectedChat(sortedChats[0]);
            }
          }
        } else {
          // Auto-select first chat if available
          if (sortedChats.length > 0 && !selectedChat) {
            setSelectedChat(sortedChats[0]);
          }
        }
      } catch (err) {
        console.error('❌ Failed to load chats:', err);
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, setSearchParams]);

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChat?.chatAiId) return;

    const loadMessages = async () => {
      try {
        console.log('📡 Loading messages for chatAiId:', selectedChat.chatAiId);
        const response = await chatAIService.getChatHistory(selectedChat.chatAiId);
        console.log('📥 Messages response:', response);
        
        // Backend returns: { success: true, data: { chatTitle: "...", messages: [...] } }
        const messagesData = response?.data?.messages || [];
        console.log('💬 Messages data:', messagesData);

        // Map to consistent format
        const mappedMessages = messagesData.map((msg) => ({
          messageId: msg.messageId || msg.MessageId,
          chatAiId: msg.chatAiId || msg.ChatAiId,
          question: msg.question || msg.Question,
          answer: msg.answer || msg.Answer,
          createdAt: msg.createdAt || msg.CreatedAt,
        }));

        setMessages(mappedMessages);
        setTimeout(() => scrollToBottom(), 200);
      } catch (err) {
        console.error('❌ Failed to load messages:', err);
      }
    };

    loadMessages();
  }, [selectedChat?.chatAiId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (selectedChat?.chatAiId && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, selectedChat?.chatAiId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateChat = async () => {
    try {
      setCreatingChat(true);
      const userId = user?.id;
      if (!userId) {
        alert('Không thể tạo chat. Vui lòng đăng nhập lại.');
        return;
      }

      console.log('📤 Creating new AI chat for user:', userId);
      const result = await chatAIService.createChat(userId);
      console.log('✅ Chat created, result:', result);

      // Backend returns: { success: true, data: { chatId, title, createdAt } }
      const newChat = result?.data || {};
      const chatAiId = newChat.chatId || newChat.chatAiId || newChat.ChatAiId || newChat.ChatAiid;
      const mappedChat = {
        chatAiId: chatAiId,
        userId: newChat.userId || newChat.UserId,
        title: newChat.title || newChat.Title || `Chat ${chatAiId || 'Unknown'}`,
        createdAt: newChat.createdAt || newChat.CreatedAt,
        updatedAt: newChat.updatedAt || newChat.UpdatedAt || newChat.createdAt || newChat.CreatedAt,
      };

      setChats((prev) => [mappedChat, ...prev]);
      setSelectedChat(mappedChat);
      setMessages([]);
    } catch (err) {
      console.error('❌ Failed to create chat:', err);
      alert('Không thể tạo chat. Vui lòng thử lại.');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    // Validate chatAiId
    const chatAiId = selectedChat.chatAiId;
    if (!chatAiId) {
      console.error('❌ chatAiId is undefined:', selectedChat);
      alert('Lỗi: Không tìm thấy ID cuộc trò chuyện. Vui lòng chọn lại chat hoặc tạo chat mới.');
      return;
    }

    const question = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Add user question immediately (optimistic update)
    const userMessageId = Date.now();
    const userMessage = {
      messageId: userMessageId,
      chatAiId: selectedChat.chatAiId,
      question: question,
      answer: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    try {
      console.log('📤 Sending message to AI:', {
        chatAiId: chatAiId,
        question: question,
        selectedChat: selectedChat,
      });

      const result = await chatAIService.sendMessage(chatAiId, question);
      console.log('✅ Message sent, result:', result);

      // Backend returns: { success: true, data: {...} }
      const responseData = result?.data || {};
      const aiMessage = {
        messageId: responseData.messageId || responseData.MessageId || Date.now() + 1,
        chatAiId: selectedChat.chatAiId,
        question: question,
        answer: responseData.answer || responseData.Answer,
        createdAt: responseData.createdAt || responseData.CreatedAt || new Date().toISOString(),
      };

      // Replace the optimistic message with the real one
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.messageId !== userMessageId);
        return [...filtered, aiMessage];
      });

      // Update chat's updatedAt
      setChats((prev) => {
        const updated = prev.map((chat) =>
          chat.chatAiId === selectedChat.chatAiId
            ? { ...chat, updatedAt: aiMessage.createdAt }
            : chat
        );
        // Move updated chat to top
        const chatIndex = updated.findIndex((c) => c.chatAiId === selectedChat.chatAiId);
        if (chatIndex > 0) {
          const [movedChat] = updated.splice(chatIndex, 1);
          updated.unshift(movedChat);
        }
        return updated;
      });

      setSelectedChat((prev) => ({
        ...prev,
        updatedAt: aiMessage.createdAt,
      }));

      scrollToBottom();
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.messageId !== userMessageId));
      
      if (err.response?.status === 429) {
        const errorData = err.response?.data;
        const message = errorData?.message || 'Bạn đã hết lượt sử dụng AI chat hôm nay. Vui lòng thử lại sau.';
        alert(message);
      } else {
        alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      }
      setNewMessage(question); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async (chatAiId, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      return;
    }

    try {
      await chatAIService.deleteChat(chatAiId);
      setChats((prev) => prev.filter((chat) => chat.chatAiId !== chatAiId));
      if (selectedChat?.chatAiId === chatAiId) {
        const remainingChats = chats.filter((chat) => chat.chatAiId !== chatAiId);
        setSelectedChat(remainingChats.length > 0 ? remainingChats[0] : null);
        setMessages([]);
      }
    } catch (err) {
      console.error('❌ Failed to delete chat:', err);
      alert('Không thể xóa chat. Vui lòng thử lại.');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    let date = new Date(dateString);
    if (!dateString.includes('Z') && !dateString.includes('+')) {
      date = new Date(dateString + 'Z');
    }
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    let date = new Date(dateString);
    if (!dateString.includes('Z') && !dateString.includes('+')) {
      date = new Date(dateString + 'Z');
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

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
      <div className="expert-chat-ai-page">
        <div className="loading">
          <p>Đang tải...</p>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            Đang tải danh sách chat AI...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-chat-ai-page">
      <div className="chat-container">
        {/* Chat List Sidebar */}
        <div className="chat-list-sidebar">
          <div className="chat-list-header">
            <h2>Chat với AI</h2>
            <button
              className="create-chat-button"
              onClick={handleCreateChat}
              disabled={creatingChat}
            >
              {creatingChat ? 'Đang tạo...' : '+ Tạo chat mới'}
            </button>
          </div>
          <div className="chat-list">
            {chats.length === 0 ? (
              <div className="empty-chat-list">
                <p>Chưa có cuộc trò chuyện nào</p>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  Nhấn "Tạo chat mới" để bắt đầu
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.chatAiId}
                  className={`chat-item ${selectedChat?.chatAiId === chat.chatAiId ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-item-info">
                    <div className="chat-item-name">{chat.title}</div>
                    <div className="chat-item-time">
                      {formatDate(chat.updatedAt || chat.createdAt)}
                    </div>
                  </div>
                  <button
                    className="delete-chat-button"
                    onClick={(e) => handleDeleteChat(chat.chatAiId, e)}
                    title="Xóa chat"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
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
                  <div className="chat-header-avatar ai-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <div className="chat-header-name">{selectedChat.title}</div>
                    <div className="chat-header-subtitle">Trợ lý AI</div>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>Chưa có tin nhắn nào</p>
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                      Bắt đầu trò chuyện với AI bằng cách nhập câu hỏi
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const showDate =
                      index === 0 ||
                      formatDate(messages[index - 1].createdAt) !== formatDate(msg.createdAt);
                    
                    // Use a unique key combining messageId and index
                    const uniqueKey = msg.messageId ? `msg-${msg.messageId}` : `msg-${index}-${msg.createdAt || Date.now()}`;

                    return (
                      <React.Fragment key={uniqueKey}>
                        {showDate && (
                          <div className="message-date-divider">
                            {formatDate(msg.createdAt)}
                          </div>
                        )}
                        {/* User Question */}
                        {msg.question && (
                          <div className="message message-sent">
                            <div className="message-content">
                              <p>{msg.question}</p>
                              <span className="message-time">{formatTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        )}
                        {/* AI Answer */}
                        {msg.answer && (
                          <div className="message message-received">
                            <div className="message-content">
                              <p>{stripMarkdown(msg.answer)}</p>
                              <span className="message-time">{formatTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Nhập câu hỏi cho AI..."
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
              <p>Chọn một cuộc trò chuyện hoặc tạo chat mới để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertChatAI;

