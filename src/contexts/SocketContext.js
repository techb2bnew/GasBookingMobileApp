import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import { useSelector } from 'react-redux';
import socketService from '../utils/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../redux/store';
import { setupSocketListeners } from '../redux/socketMiddleware';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  
  // Get auth state from Redux
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
  const authToken = useSelector(state => state.auth?.token);

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && authToken) {
      console.log('🔐 User authenticated, initializing socket...');
      initializeSocket();
    } else {
      console.log('⏸️ User not authenticated, waiting for login...');
      // Disconnect socket if user logs out
      if (socket) {
        console.log('🔌 User logged out, disconnecting socket...');
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, authToken]);

  const initializeSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('❌ No auth token found, skipping socket connection');
        return;
      }

      console.log('🔌 Initializing socket connection...');
      const socketInstance = await socketService.connect();
      
      if (socketInstance) {
        console.log('✅ Socket instance created');
        setSocket(socketInstance);
        setIsConnected(true);
        
        // Test socket connection with a ping
        socketInstance.emit('ping');
        socketInstance.on('pong', (data) => {
          console.log('🏓 Socket ping-pong successful:', data);
        });
        
        // Setup Redux listeners after socket is ready
        setTimeout(() => {
          console.log('🎧 Setting up Redux socket listeners...');
          setupSocketListeners(store);
          console.log('✅ Redux socket listeners setup complete');
        }, 2000);
      } else {
        console.log('❌ Failed to create socket instance');
      }
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      setConnectionError(error.message);
    }
  };

  // Removed - all listeners handled by socketService now

  // Removed - handled by socketService and Redux middleware

  // Removed - socketService handles reconnection

  // Method to manually reconnect
  const reconnect = async () => {
    try {
      setConnectionError(null);
      console.log('🔄 Manual reconnection...');
      const socketInstance = await socketService.reconnect();
      if (socketInstance) {
        setSocket(socketInstance);
        setIsConnected(true);
        
        // Setup Redux listeners
        setTimeout(() => {
          console.log('🎧 Setting up Redux listeners on manual reconnect...');
          setupSocketListeners(store);
          console.log('✅ Redux socket listeners setup complete');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Manual reconnection failed:', error);
      setConnectionError(error.message);
    }
  };

  // Method to disconnect
  const disconnect = () => {
    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
  };

  // Method to emit events
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.log('❌ Cannot emit, socket not connected:', event);
    }
  };

  // Method to subscribe to events
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Method to unsubscribe from events
  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const contextValue = {
    socket,
    isConnected,
    connectionError,
    emit,
    on,
    off,
    reconnect,
    disconnect,
    // Helper methods
    joinOrderRoom: (orderId) => socketService.joinOrderRoom(orderId),
    leaveOrderRoom: (orderId) => socketService.leaveOrderRoom(orderId),
    getConnectionStatus: () => socketService.getConnectionStatus()
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
