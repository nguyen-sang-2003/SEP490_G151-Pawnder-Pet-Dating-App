// Import polyfills for React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../config/api.config';

/**
 * SignalR Service for real-time chat functionality
 */
class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private currentUserId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Initialize and start SignalR connection
   */
  async connect(userId: number): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('📡 SignalR already connected');
      return;
    }

    this.currentUserId = userId;

    // Build connection URL
    const hubUrl = `${API_BASE_URL}/chatHub`.replace('/api', '');
    console.log('📡 Connecting to SignalR hub:', hubUrl);

    // Create connection
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, 60s
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          if (retryContext.previousRetryCount === 3) return 30000;
          return 60000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Setup event handlers
    this.setupEventHandlers();

    try {
      // Start connection
      await this.connection.start();
      console.log('✅ SignalR connected successfully');

      // Register user after connection
      await this.registerUser(userId);
      
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('❌ SignalR connection failed:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup connection event handlers
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection closed
    this.connection.onclose((error) => {
      console.log('📡 SignalR connection closed', error);
      this.handleReconnect();
    });

    // Reconnecting
    this.connection.onreconnecting((error) => {
      console.log('📡 SignalR reconnecting...', error);
      this.notifyListeners('reconnecting', null);
    });

    // Reconnected
    this.connection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected:', connectionId);
      this.reconnectAttempts = 0;
      
      // Re-register user
      if (this.currentUserId) {
        this.registerUser(this.currentUserId);
      }
      
      this.notifyListeners('reconnected', connectionId);
    });

    // Message received
    this.connection.on('ReceiveMessage', (data) => {
      console.log('📨 Message received:', data);
      this.notifyListeners('ReceiveMessage', data);
    });

    // User online
    this.connection.on('UserOnline', (userId) => {
      console.log('👤 User online:', userId);
      this.notifyListeners('UserOnline', userId);
    });

    // User offline
    this.connection.on('UserOffline', (userId) => {
      console.log('👤 User offline:', userId);
      this.notifyListeners('UserOffline', userId);
    });

    // User joined chat
    this.connection.on('UserJoinedChat', (userId, matchId) => {
      console.log('👤 User joined chat:', userId, matchId);
      this.notifyListeners('UserJoinedChat', { userId, matchId });
    });

    // User left chat
    this.connection.on('UserLeftChat', (userId, matchId) => {
      console.log('👤 User left chat:', userId, matchId);
      this.notifyListeners('UserLeftChat', { userId, matchId });
    });

    // User typing
    this.connection.on('UserTyping', (data) => {
      console.log('⌨️ User typing:', data);
      this.notifyListeners('UserTyping', data);
    });

    // Messages read
    this.connection.on('MessagesRead', (data) => {
      console.log('👁️ Messages read:', data);
      this.notifyListeners('MessagesRead', data);
    });
  }

  /**
   * Register user with the hub
   */
  private async registerUser(userId: number): Promise<void> {
    if (!this.isConnected()) return;

    try {
      await this.connection!.invoke('RegisterUser', userId);
      console.log('✅ User registered:', userId);
    } catch (error) {
      console.error('❌ Failed to register user:', error);
    }
  }

  /**
   * Join a chat room
   */
  async joinChat(matchId: number, userId: number): Promise<void> {
    if (!this.isConnected()) {
      console.warn('⚠️ Cannot join chat - not connected');
      return;
    }

    try {
      await this.connection!.invoke('JoinChat', matchId, userId);
      console.log(`✅ Joined chat room: Match_${matchId}`);
    } catch (error) {
      console.error('❌ Failed to join chat:', error);
      throw error;
    }
  }

  /**
   * Leave a chat room
   */
  async leaveChat(matchId: number, userId: number): Promise<void> {
    if (!this.isConnected()) return;

    try {
      await this.connection!.invoke('LeaveChat', matchId, userId);
      console.log(`✅ Left chat room: Match_${matchId}`);
    } catch (error) {
      console.error('❌ Failed to leave chat:', error);
    }
  }

  /**
   * Send a message via SignalR
   */
  async sendMessage(matchId: number, fromUserId: number, message: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to chat server');
    }

    try {
      await this.connection!.invoke('SendMessage', matchId, fromUserId, message);
      console.log('✅ Message sent via SignalR');
    } catch (error) {
      console.error('❌ Failed to send message via SignalR:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   */
  async sendTyping(matchId: number, userId: number, isTyping: boolean): Promise<void> {
    if (!this.isConnected()) return;

    try {
      await this.connection!.invoke('Typing', matchId, userId, isTyping);
    } catch (error) {
      console.error('❌ Failed to send typing indicator:', error);
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(matchId: number, userId: number): Promise<void> {
    if (!this.isConnected()) return;

    try {
      await this.connection!.invoke('MarkAsRead', matchId, userId);
      console.log('✅ Marked messages as read');
    } catch (error) {
      console.error('❌ Failed to mark as read:', error);
    }
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: number): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      return await this.connection!.invoke('IsUserOnline', userId);
    } catch (error) {
      console.error('❌ Failed to check online status:', error);
      return false;
    }
  }

  /**
   * Get all online users
   */
  async getOnlineUsers(): Promise<number[]> {
    if (!this.isConnected()) return [];

    try {
      return await this.connection!.invoke('GetOnlineUsers');
    } catch (error) {
      console.error('❌ Failed to get online users:', error);
      return [];
    }
  }

  /**
   * Disconnect from SignalR
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('📡 SignalR disconnected');
      } catch (error) {
        console.error('❌ Error disconnecting:', error);
      }
      
      this.connection = null;
      this.currentUserId = null;
      this.listeners.clear();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Add event listener
   */
  on(eventName: string, callback: Function): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(eventName: string, callback: Function): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(eventName: string, data: any): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventName} listener:`, error);
        }
      });
    }
  }

  /**
   * Handle reconnection attempts
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.notifyListeners('connectionFailed', null);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`📡 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.currentUserId) {
        this.connect(this.currentUserId);
      }
    }, delay);
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;

