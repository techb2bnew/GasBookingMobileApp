import { useEffect, useCallback, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Alert } from 'react-native';

// Hook for order-related socket events
export const useOrderEvents = (callbacks = {}) => {
  const { socket, on, off } = useSocket();

  const {
    onOrderCreated,
    onOrderStatusUpdated,
    onOrderAssigned,
    onOrderDelivered,
    onOrderCancelled
  } = callbacks;

  useEffect(() => {
    if (!socket) return;

    // Order events handlers
    const handleOrderCreated = (data) => {
      console.log('📦 Order Created:', data.data);
      onOrderCreated?.(data.data);
    };

    const handleOrderStatusUpdated = (data) => {
      console.log('📋 Order Status Updated:', data.data);
      onOrderStatusUpdated?.(data.data);
    };

    const handleOrderAssigned = (data) => {
      console.log('👨‍💼 Order Assigned:', data.data);
      onOrderAssigned?.(data.data);
    };

    const handleOrderDelivered = (data) => {
      console.log('✅ Order Delivered:', data.data);
      onOrderDelivered?.(data.data);
    };

    // Register event listeners
    on('order:created', handleOrderCreated);
    on('order:status-updated', handleOrderStatusUpdated);
    on('order:assigned', handleOrderAssigned);
    on('order:delivered', handleOrderDelivered);

    // Cleanup
    return () => {
      off('order:created', handleOrderCreated);
      off('order:status-updated', handleOrderStatusUpdated);
      off('order:assigned', handleOrderAssigned);
      off('order:delivered', handleOrderDelivered);
    };
  }, [socket, on, off, onOrderCreated, onOrderStatusUpdated, onOrderAssigned, onOrderDelivered]);
};

// Hook for product-related socket events
export const useProductEvents = (callbacks = {}) => {
  const { socket, on, off } = useSocket();

  const {
    onProductCreated,
    onProductUpdated,
    onInventoryUpdated,
    onLowStockAlert
  } = callbacks;

  useEffect(() => {
    if (!socket) return;

    const handleProductCreated = (data) => {
      console.log('🎁 Product Created:', data.data);
      onProductCreated?.(data.data);
    };

    const handleProductUpdated = (data) => {
      console.log('📝 Product Updated:', data.data);
      onProductUpdated?.(data.data);
    };

    const handleInventoryUpdated = (data) => {
      console.log('📊 Inventory Updated:', data.data);
      onInventoryUpdated?.(data.data);
    };

    const handleLowStockAlert = (data) => {
      console.log('⚠️ Low Stock Alert:', data.data);
      onLowStockAlert?.(data.data);
      
      // Show alert for low stock
      const { productName, stock, agencyName } = data.data;
      Alert.alert(
        'Low Stock Alert',
        `${productName} at ${agencyName} is running low! Only ${stock} left.`,
        [{ text: 'OK' }]
      );
    };

    // Register event listeners
    on('product:created', handleProductCreated);
    on('product:updated', handleProductUpdated);
    on('inventory:updated', handleInventoryUpdated);
    on('inventory:low-stock', handleLowStockAlert);

    return () => {
      off('product:created', handleProductCreated);
      off('product:updated', handleProductUpdated);
      off('inventory:updated', handleInventoryUpdated);
      off('inventory:low-stock', handleLowStockAlert);
    };
  }, [socket, on, off, onProductCreated, onProductUpdated, onInventoryUpdated, onLowStockAlert]);
};

// Hook for agency-related socket events
export const useAgencyEvents = (callbacks = {}) => {
  const { socket, on, off } = useSocket();

  const {
    onAgencyCreated,
    onAgencyUpdated,
    onAgentCreated,
    onAgentUpdated
  } = callbacks;

  useEffect(() => {
    if (!socket) return;

    const handleAgencyCreated = (data) => {
      console.log('🏢 Agency Created:', data.data);
      onAgencyCreated?.(data.data);
    };

    const handleAgencyUpdated = (data) => {
      console.log('🏢 Agency Updated:', data.data);
      onAgencyUpdated?.(data.data);
    };

    const handleAgentCreated = (data) => {
      console.log('👨‍💼 Agent Created:', data.data);
      onAgentCreated?.(data.data);
    };

    const handleAgentUpdated = (data) => {
      console.log('👨‍💼 Agent Updated:', data.data);
      onAgentUpdated?.(data.data);
    };

    // Register event listeners
    on('agency:created', handleAgencyCreated);
    on('agency:updated', handleAgencyUpdated);
    on('agent:created', handleAgentCreated);
    on('agent:updated', handleAgentUpdated);

    return () => {
      off('agency:created', handleAgencyCreated);
      off('agency:updated', handleAgencyUpdated);
      off('agent:created', handleAgentCreated);
      off('agent:updated', handleAgentUpdated);
    };
  }, [socket, on, off, onAgencyCreated, onAgencyUpdated, onAgentCreated, onAgentUpdated]);
};

// Hook for notification events
export const useNotificationEvents = (callbacks = {}) => {
  const { socket, on, off } = useSocket();

  const {
    onNotification,
    onSystemMessage
  } = callbacks;

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      console.log('🔔 Notification:', data);
      onNotification?.(data);
    };

    const handleSystemMessage = (data) => {
      console.log('📢 System Message:', data);
      onSystemMessage?.(data);
    };

    // Register event listeners
    on('notification', handleNotification);
    on('system:message', handleSystemMessage);

    return () => {
      off('notification', handleNotification);
      off('system:message', handleSystemMessage);
    };
  }, [socket, on, off, onNotification, onSystemMessage]);
};

// Hook for force logout detection
export const useForceLogout = (onLogout) => {
  const { socket, on, off } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleForceLogout = (data) => {
      console.log('🚫 Force logout received:', data);
      onLogout?.(data);
    };

    // Register event listeners for both types of force logout
    on('user:force-logout', handleForceLogout);
    on('agency:force-logout', handleForceLogout);

    return () => {
      off('user:force-logout', handleForceLogout);
      off('agency:force-logout', handleForceLogout);
    };
  }, [socket, on, off, onLogout]);
};

// Combined hook for common socket events (for convenience)
export const useCommonSocketEvents = (callbacks = {}) => {
  useOrderEvents(callbacks);
  useProductEvents(callbacks);
  useNotificationEvents(callbacks);
  
  // Return socket connection status and methods
  const { isConnected, connectionError, reconnect } = useSocket();
  
  return {
    isConnected,
    connectionError,
    reconnect
  };
};

// Hook to join/leave order rooms for real-time order tracking
export const useOrderRoom = (orderId) => {
  const { joinOrderRoom, leaveOrderRoom } = useSocket();

  useEffect(() => {
    if (orderId) {
      console.log('🔗 Joining order room:', orderId);
      joinOrderRoom(orderId);

      return () => {
        console.log('🔌 Leaving order room:', orderId);
        leaveOrderRoom(orderId);
      };
    }
  }, [orderId, joinOrderRoom, leaveOrderRoom]);
};

// Hook to get real-time connection status
export const useConnectionStatus = () => {
  const { isConnected, connectionError, getConnectionStatus } = useSocket();
  
  const [status, setStatus] = useState({
    isConnected: false,
    socketId: null,
    reconnectionAttempts: 0
  });

  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = getConnectionStatus();
      setStatus(currentStatus);
    };

    // Update status immediately
    updateStatus();

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, [isConnected, getConnectionStatus]);

  return {
    ...status,
    connectionError
  };
};
