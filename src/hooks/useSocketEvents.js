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

// Hook for Tax Management socket events
export const useTaxEvents = (callbacks = {}) => {
  const { socket, on, off } = useSocket();
  
  const { onTaxUpdated, onTaxDeleted } = callbacks;

  useEffect(() => {
    if (!socket) return;

    const handleTaxUpdated = (data) => {
      console.log('💰 Tax Updated:', data.data);
      onTaxUpdated?.(data.data);
      // Alert removed - CheckoutScreen will show specific alert with new total
    };

    const handleTaxDeleted = (data) => {
      console.log('💰 Tax Deleted:', data.data);
      onTaxDeleted?.(data.data);
      // Alert removed - CheckoutScreen will show specific alert with new total
    };

    // Register event listeners
    on('tax:updated', handleTaxUpdated);
    on('tax:deleted', handleTaxDeleted);

    return () => {
      off('tax:updated', handleTaxUpdated);
      off('tax:deleted', handleTaxDeleted);
    };
  }, [socket, on, off, onTaxUpdated, onTaxDeleted]);
};

// Hook for Platform Charge socket events
export const usePlatformChargeEvents = (callbacks = {}) => {
  const { socket, on, off } = useSocket();
  
  const { onPlatformChargeUpdated, onPlatformChargeDeleted } = callbacks;

  useEffect(() => {
    if (!socket) return;

    const handlePlatformChargeUpdated = (data) => {
      console.log('🏦 Platform Charge Updated:', data.data);
      onPlatformChargeUpdated?.(data.data);
      // Alert removed - CheckoutScreen will show specific alert with new total
    };

    const handlePlatformChargeDeleted = (data) => {
      console.log('🏦 Platform Charge Deleted:', data.data);
      onPlatformChargeDeleted?.(data.data);
      // Alert removed - CheckoutScreen will show specific alert with new total
    };

    // Register event listeners
    on('platform-charge:updated', handlePlatformChargeUpdated);
    on('platform-charge:deleted', handlePlatformChargeDeleted);

    return () => {
      off('platform-charge:updated', handlePlatformChargeUpdated);
      off('platform-charge:deleted', handlePlatformChargeDeleted);
    };
  }, [socket, on, off, onPlatformChargeUpdated, onPlatformChargeDeleted]);
};

// Hook for Delivery Charge socket events
export const useDeliveryChargeEvents = (callbacks = {}) => {
  const { socket, on, off } = useSocket();
  
  const { 
    onDeliveryChargeCreated, 
    onDeliveryChargeUpdated, 
    onDeliveryChargeDeleted 
  } = callbacks;

  useEffect(() => {
    if (!socket) return;

    const handleDeliveryChargeCreated = (data) => {
      console.log('🚚 Delivery Charge Created:', data.data);
      onDeliveryChargeCreated?.(data.data);
    };

    const handleDeliveryChargeUpdated = (data) => {
      console.log('🚚 Delivery Charge Updated:', data.data);
      onDeliveryChargeUpdated?.(data.data);
      // Alert removed - CheckoutScreen will show specific alert with amount
    };

    const handleDeliveryChargeDeleted = (data) => {
      console.log('🚚 Delivery Charge Deleted:', data.data);
      onDeliveryChargeDeleted?.(data.data);
    };

    // Register event listeners
    on('delivery-charge:created', handleDeliveryChargeCreated);
    on('delivery-charge:updated', handleDeliveryChargeUpdated);
    on('delivery-charge:deleted', handleDeliveryChargeDeleted);

    return () => {
      off('delivery-charge:created', handleDeliveryChargeCreated);
      off('delivery-charge:updated', handleDeliveryChargeUpdated);
      off('delivery-charge:deleted', handleDeliveryChargeDeleted);
    };
  }, [socket, on, off, onDeliveryChargeCreated, onDeliveryChargeUpdated, onDeliveryChargeDeleted]);
};

// Hook for Coupon socket events
export const useCouponEvents = (callbacks = {}) => {
  const { socket, on, off } = useSocket();
  
  const { 
    onCouponCreated, 
    onCouponUpdated, 
    onCouponStatusChanged, 
    onCouponDeleted 
  } = callbacks;

  useEffect(() => {
    if (!socket) return;

    const handleCouponCreated = (data) => {
      console.log('🎟️ Coupon Created:', data.data);
      onCouponCreated?.(data.data);
      
      const coupon = data.data;
      const discount = coupon.discountType === 'percentage' 
        ? `${coupon.discountValue}%` 
        : `KSH${coupon.discountValue}`;
      
      Alert.alert(
        '🎉 New Coupon Available!',
        `Use code ${coupon.code} to save ${discount}`,
        [{ text: 'Great!' }]
      );
    };

    const handleCouponUpdated = (data) => {
      console.log('🎟️ Coupon Updated:', data.data);
      onCouponUpdated?.(data.data);
    };

    const handleCouponStatusChanged = (data) => {
      console.log('🎟️ Coupon Status Changed:', data.data);
      onCouponStatusChanged?.(data.data);
      
      const coupon = data.data;
      if (!coupon.isActive) {
        Alert.alert(
          'Coupon Deactivated',
          `Coupon ${coupon.code} is no longer available`,
          [{ text: 'OK' }]
        );
      }
    };

    const handleCouponDeleted = (data) => {
      console.log('🎟️ Coupon Deleted:', data.data);
      onCouponDeleted?.(data.data);
      
      Alert.alert(
        'Coupon Removed',
        `Coupon ${data.data.code} has been removed`,
        [{ text: 'OK' }]
      );
    };

    // Register event listeners
    on('coupon:created', handleCouponCreated);
    on('coupon:updated', handleCouponUpdated);
    on('coupon:status-changed', handleCouponStatusChanged);
    on('coupon:deleted', handleCouponDeleted);

    return () => {
      off('coupon:created', handleCouponCreated);
      off('coupon:updated', handleCouponUpdated);
      off('coupon:status-changed', handleCouponStatusChanged);
      off('coupon:deleted', handleCouponDeleted);
    };
  }, [socket, on, off, onCouponCreated, onCouponUpdated, onCouponStatusChanged, onCouponDeleted]);
};

// Hook for all pricing-related events (convenience hook)
export const usePricingEvents = (callbacks = {}) => {
  useTaxEvents(callbacks);
  usePlatformChargeEvents(callbacks);
  useDeliveryChargeEvents(callbacks);
  useCouponEvents(callbacks);
};

// Hook to join/leave agency room for real-time product updates
export const useAgencyRoom = (agencyId) => {
  const { socket, emit } = useSocket();

  useEffect(() => {
    if (socket && agencyId) {
      console.log('🏢 Joining agency room:', agencyId);
      emit('join-agency-room', { agencyId });

      return () => {
        console.log('🏢 Leaving agency room:', agencyId);
        emit('leave-agency-room', { agencyId });
      };
    }
  }, [socket, agencyId, emit]);
};