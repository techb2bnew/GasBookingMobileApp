import socketService from '../utils/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  handleOrderCreated, 
  handleOrderStatusUpdated, 
  handleOrderAssigned, 
  handleOrderDelivered 
} from './slices/orderSlice';
import { handleForceLogout } from './slices/authSlice';
import { handleAgencyStatusChange, removeAgency } from './slices/agenciesSlice';

// Socket middleware to connect Redux with Socket.IO events
const socketMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Handle auth success - connect socket
  if (action.type === 'auth/verifyOTPSuccess') {
    console.log('🔌 Auth success, connecting socket...');
    setTimeout(() => {
      socketService.connect();
    }, 1000); // Small delay to ensure token is stored
  }

  // Handle logout - disconnect socket
  if (action.type === 'auth/logout' || action.type === 'auth/handleForceLogout') {
    console.log('🔌 Logout detected, disconnecting socket...');
    socketService.disconnect();
  }

  return result;
};

// Socket event listeners setup
export const setupSocketListeners = (store) => {
  const socket = socketService.socket;
  
  if (!socket) {
    console.log('⚠️ No socket available for listeners setup - will be called after connection');
    return;
  }

  // Check if already set up to avoid duplicates
  if (socket._hasListeners) {
    console.log('✅ Socket listeners already set up, skipping duplicate setup');
    return;
  }

  console.log('🎧 Setting up Redux Socket event listeners...');
  socket._hasListeners = true; // Mark as set up

  // Test listener to verify socket is working
  socket.on('connected', (data) => {
    console.log('🎉 Socket connected event received:', data);
  });

  // Test listener for any socket events
  socket.onAny((eventName, ...args) => {
    console.log('📡 Socket event received:', eventName, args);
    if (eventName === 'product:availability-changed') {
      console.log('🎯 PRODUCT AVAILABILITY EVENT RECEIVED!', args[0]);
    }
  });

  // Order Events
  socket.on('order:created', (data) => {
    console.log('📦 Redux: Order Created', data.data);
    console.log('📦 Dispatching handleOrderCreated to Redux...');
    store.dispatch(handleOrderCreated(data.data));
    console.log('✅ Redux dispatch complete for order:created');
  });

  socket.on('order:status-updated', (data) => {
    console.log('📋 Redux: Order Status Updated', data.data);
    console.log('📋 Order ID:', data.data.orderId, 'Status:', data.data.status);
    console.log('📋 Dispatching handleOrderStatusUpdated to Redux...');
    store.dispatch(handleOrderStatusUpdated(data.data));
    console.log('✅ Redux dispatch complete for order:status-updated');
    
    // Log current orders in store
    const currentOrders = store.getState().orders.orders;
    console.log('📊 Current orders in Redux:', currentOrders.length);
    const updatedOrder = currentOrders.find(o => 
      o.id === data.data.orderId || o.orderId === data.data.orderId
    );
    if (updatedOrder) {
      console.log('✅ Order found and updated:', updatedOrder.orderNumber, updatedOrder.status);
    } else {
      console.log('⚠️ Order NOT found in Redux:', data.data.orderId);
    }
  });

  socket.on('order:assigned', (data) => {
    console.log('👨‍💼 Redux: Order Assigned', data.data);
    console.log('👨‍💼 Dispatching handleOrderAssigned to Redux...');
    store.dispatch(handleOrderAssigned(data.data));
    console.log('✅ Redux dispatch complete for order:assigned');
  });

  socket.on('order:delivered', (data) => {
    console.log('✅ Redux: Order Delivered', data.data);
    console.log('✅ Dispatching handleOrderDelivered to Redux...');
    store.dispatch(handleOrderDelivered(data.data));
    console.log('✅ Redux dispatch complete for order:delivered');
  });

  // Auth Events (Force Logout)
  socket.on('user:force-logout', async (data) => {
    console.log('🚫 Redux: User Force Logout', data.data || data);
    console.log('🚫 Reason:', data.data?.message || data.message);
    
    // Clear AsyncStorage
    await AsyncStorage.multiRemove([
      'authToken',
      'userToken',
      'userId',
      'userRole',
      'agencyId',
      'userData'
    ]);
    console.log('✅ AsyncStorage cleared');
    
    // Dispatch to Redux
    store.dispatch(handleForceLogout(data.data || data));
    
    // Disconnect socket
    socketService.disconnect();
    console.log('✅ Socket disconnected');
    
    // Show alert
    const Alert = require('react-native').Alert;
    Alert.alert(
      'Account Blocked',
      data.data?.message || 'Your account has been blocked by admin.',
      [{ text: 'OK', onPress: () => console.log('User acknowledged force logout') }],
      { cancelable: false }
    );
  });

  socket.on('agency:force-logout', async (data) => {
    console.log('🚫 Redux: Agency Force Logout', data.data || data);
    
    // Same handling as user force logout
    await AsyncStorage.multiRemove([
      'authToken',
      'userToken',
      'userId',
      'userRole',
      'agencyId',
      'userData'
    ]);
    
    store.dispatch(handleForceLogout(data.data || data));
    socketService.disconnect();
    
    const Alert = require('react-native').Alert;
    Alert.alert(
      'Account Alert',
      data.data?.message || 'Your access has been revoked.',
      [{ text: 'OK' }],
      { cancelable: false }
    );
  });

  // Product Events (you can extend these based on your product slice)
  socket.on('product:created', (data) => {
    console.log('🎁 Redux: Product Created', data.data);
    // TODO: Dispatch to product slice when needed
  });

  socket.on('product:updated', (data) => {
    console.log('📝 Redux: Product Updated', data.data);
    // TODO: Dispatch to product slice when needed
  });

  socket.on('inventory:updated', (data) => {
    console.log('📊 Redux: Inventory Updated', data.data);
    // TODO: Dispatch to product slice when needed
  });

  socket.on('inventory:low-stock', (data) => {
    console.log('⚠️ Redux: Low Stock Alert', data.data);
    // TODO: Handle low stock alerts
  });

  // Product Availability Changes (for real-time product updates)
  socket.on('product:availability-changed', (data) => {
    console.log('🔄 Redux: Product Availability Changed', data.data);
    console.log('🔄 Product ID:', data.data.productId);
    console.log('🔄 Agency ID:', data.data.agencyId);
    console.log('🔄 Is Active:', data.data.isActive);
    console.log('🔄 Action:', data.data.action);
    
    // Dispatch to product slice to update product availability
    store.dispatch({
      type: 'products/updateProductAvailability',
      payload: data.data
    });
    
    console.log('✅ Redux dispatch complete for product:availability-changed');
  });

  // Global Product Status Changes (admin action)
  socket.on('product:global-status-changed', (data) => {
    console.log('🌍 Redux: Global Product Status Changed', data.data);
    console.log('🌍 Product ID:', data.data.productId);
    console.log('🌍 Product Name:', data.data.productName);
    console.log('🌍 Status:', data.data.status);
    console.log('🌍 Affected Agencies:', data.data.affectedAgencies);
    console.log('🌍 Full event data:', data);
    
    store.dispatch({
      type: 'products/updateGlobalProductStatus',
      payload: data.data
    });
    
    console.log('✅ Redux dispatch complete for product:global-status-changed');
  });

  // Agency Events
  socket.on('agency:created', (data) => {
    console.log('🏢 Redux: Agency Created', data.data);
    // TODO: Dispatch to agency slice when needed
  });

  socket.on('agency:updated', (data) => {
    console.log('🏢 Redux: Agency Updated', data.data);
    
    // Handle agency status changes
    if (data.data?.statusChanged && data.data?.status) {
      console.log('🏢 Agency status changed:', data.data.id, 'to', data.data.status);
      store.dispatch(handleAgencyStatusChange({
        agencyId: data.data.id,
        status: data.data.status,
        agencyData: data.data // Pass complete agency data
      }));
    }
  });

  // Handle agency status changes specifically
  socket.on('agency:status-changed', (data) => {
    console.log('🏢 Redux: Agency Status Changed', data.data);
    store.dispatch(handleAgencyStatusChange({
      agencyId: data.data.id,
      status: data.data.status,
      agencyData: data.data // Pass complete agency data
    }));
  });

  // Agent Events
  socket.on('agent:created', (data) => {
    console.log('👨‍💼 Redux: Agent Created', data.data);
    // TODO: Dispatch to agent slice when needed
  });

  socket.on('agent:updated', (data) => {
    console.log('👨‍💼 Redux: Agent Updated', data.data);
    // TODO: Dispatch to agent slice when needed
  });

  // System Events
  socket.on('system:message', (data) => {
    console.log('📢 Redux: System Message', data);
    // TODO: Handle system messages
  });

  socket.on('notification', (data) => {
    console.log('🔔 Redux: General Notification', data);
    // TODO: Handle general notifications
  });

  console.log('✅ Socket event listeners setup complete');
};

// Clean up socket listeners
export const cleanupSocketListeners = () => {
  const socket = socketService.socket;
  
  if (socket) {
    console.log('🧹 Cleaning up Socket event listeners...');
    
    // Remove all listeners
    socket.off('order:created');
    socket.off('order:status-updated');
    socket.off('order:assigned');
    socket.off('order:delivered');
    socket.off('user:force-logout');
    socket.off('agency:force-logout');
    socket.off('product:created');
    socket.off('product:updated');
    socket.off('inventory:updated');
    socket.off('inventory:low-stock');
    socket.off('product:availability-changed');
    socket.off('product:global-status-changed');
    socket.off('agency:created');
    socket.off('agency:updated');
    socket.off('agent:created');
    socket.off('agent:updated');
    socket.off('system:message');
    socket.off('notification');
  }
};

export default socketMiddleware;
