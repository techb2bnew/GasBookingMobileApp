import io from 'socket.io-client';
import { STRINGS } from '../constants/strings';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userRole = await AsyncStorage.getItem('userRole');
      const userId = await AsyncStorage.getItem('userId');

      if (!token) {
        console.log('❌ No auth token found');
        return null;
      }

      if (!this.socket || !this.isConnected) {
        console.log('🔌 Connecting to Socket.IO server...');
        console.log('📝 User Role:', userRole, 'User ID:', userId);
        
        this.socket = io(STRINGS.SOCKET_URL, {
          auth: { 
            token,
            userId,
            role: userRole 
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: this.maxReconnectionAttempts
        });

        this.setupEventListeners(userRole, userId);
        // Remove immediate subscription - will be called on 'connect' event
      }

      return this.socket;
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      return null;
    }
  }

  setupEventListeners(userRole, userId) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket Connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectionAttempts = 0;
      
      // Setup subscriptions AFTER connection
      setTimeout(() => {
        this.setupRoleBasedSubscriptions(userRole, userId);
      }, 500);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket Connection Error:', error.message);
      this.reconnectionAttempts++;
      
      if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
        console.log('❌ Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket Reconnected after ${attemptNumber} attempts`);
      this.reconnectionAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket Reconnection Error:', error.message);
    });

    // Generic error handler
    this.socket.on('error', (error) => {
      console.error('❌ Socket Error:', error);
    });
  }

  async setupRoleBasedSubscriptions(userRole, userId) {
    if (!this.socket || !this.isConnected) return;

    try {
      const agencyId = await AsyncStorage.getItem('agencyId');
      
      console.log(`🎯 Setting up subscriptions for role: ${userRole}`);

      switch (userRole) {
        case 'admin':
          this.socket.emit('subscribe-orders');
          this.socket.emit('subscribe-products');
          this.socket.emit('subscribe-agencies');
          this.socket.emit('subscribe-agents');
          this.socket.emit('subscribe-inventory');
          console.log('👑 Admin subscriptions activated');
          break;

        case 'agency_owner':
          this.socket.emit('subscribe-orders');
          if (agencyId) {
            this.socket.emit('subscribe-inventory', agencyId);
            this.socket.emit('subscribe-agents', agencyId);
          }
          console.log('🏢 Agency Owner subscriptions activated');
          break;

        case 'customer':
          this.socket.emit('subscribe-orders');
          this.socket.emit('subscribe-agencies'); // Subscribe to agency updates
          this.socket.emit('subscribe-products'); // Subscribe to product updates
          console.log('👤 Customer subscriptions activated');
          console.log('👤 Customer joined rooms: orders, agencies, products');
          break;

        case 'agent':
          this.socket.emit('subscribe-orders');
          console.log('🚚 Agent subscriptions activated');
          break;

        default:
          console.log('❓ Unknown role, basic subscriptions only');
          break;
      }
    } catch (error) {
      console.error('❌ Error setting up subscriptions:', error);
    }
  }

  // Event listener methods
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.log('❌ Socket not connected, cannot emit:', event);
    }
  }

  // Specific event emitters for common actions
  joinOrderRoom(orderId) {
    this.emit('join-order', { orderId });
  }

  leaveOrderRoom(orderId) {
    this.emit('leave-order', { orderId });
  }

  joinAgencyRoom(agencyId) {
    this.emit('join-agency-room', { agencyId });
    console.log(`🏢 Joined agency room: ${agencyId}`);
  }

  leaveAgencyRoom(agencyId) {
    this.emit('leave-agency-room', { agencyId });
    console.log(`🏢 Left agency room: ${agencyId}`);
  }

  // Connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectionAttempts: this.reconnectionAttempts
    };
  }

  // Force disconnect
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectionAttempts = 0;
    }
  }

  // Reconnect manually
  async reconnect() {
    console.log('🔄 Manually reconnecting socket...');
    this.disconnect();
    return await this.connect();
  }
}

// Export singleton instance
export default new SocketService();
