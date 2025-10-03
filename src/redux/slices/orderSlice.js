import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder: (state, action) => {
      state.orders.unshift(action.payload); // Add to beginning of array
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find(order => order.id === orderId);
      if (order) {
        order.status = status;
        order.lastUpdated = new Date().toISOString();
      }
    },
    // Socket event handlers
    handleOrderCreated: (state, action) => {
      const orderData = action.payload;
      // Check if order already exists (avoid duplicates)
      const existingOrder = state.orders.find(order => order.orderId === orderData.orderId);
      if (!existingOrder) {
        state.orders.unshift({
          id: orderData.orderId,
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          totalAmount: orderData.totalAmount,
          status: orderData.status || 'pending',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        });
      }
    },
    handleOrderStatusUpdated: (state, action) => {
      const { orderId, orderNumber, status, assignedAgentId } = action.payload;
      const order = state.orders.find(order => 
        order.id === orderId || 
        order.orderId === orderId || 
        order.orderNumber === orderNumber
      );
      if (order) {
        order.status = status;
        if (assignedAgentId) {
          order.assignedAgentId = assignedAgentId;
        }
        order.lastUpdated = new Date().toISOString();
        console.log('✅ Order status updated in Redux:', order.orderNumber, status);
      } else {
        console.log('⚠️ Order not found in Redux:', orderId, orderNumber);
      }
    },
    handleOrderAssigned: (state, action) => {
      const { orderId, orderNumber, agentId, agentName, assignedAgentId } = action.payload;
      const order = state.orders.find(order => 
        order.id === orderId || 
        order.orderId === orderId || 
        order.orderNumber === orderNumber
      );
      if (order) {
        order.assignedAgentId = assignedAgentId || agentId;
        order.agentName = agentName;
        order.status = 'assigned';
        order.lastUpdated = new Date().toISOString();
        console.log('✅ Order assigned in Redux:', order.orderNumber, agentName);
      } else {
        console.log('⚠️ Order not found in Redux for assignment:', orderId, orderNumber);
      }
    },
    handleOrderDelivered: (state, action) => {
      const { orderId, orderNumber, deliveryProof, paymentReceived } = action.payload;
      const order = state.orders.find(order => 
        order.id === orderId || 
        order.orderId === orderId || 
        order.orderNumber === orderNumber
      );
      if (order) {
        order.status = 'delivered';
        order.deliveryProof = deliveryProof;
        order.paymentReceived = paymentReceived;
        order.deliveredAt = new Date().toISOString();
        order.lastUpdated = new Date().toISOString();
        console.log('✅ Order delivered in Redux:', order.orderNumber);
      } else {
        console.log('⚠️ Order not found in Redux for delivery:', orderId, orderNumber);
      }
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    reorder: (state, action) => {
      const originalOrder = state.orders.find(order => order.id === action.payload);
      if (originalOrder) {
        const newOrder = {
          ...originalOrder,
          id: Date.now().toString(),
          status: 'Pending',
          orderDate: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        state.orders.unshift(newOrder);
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    cancelOrder: (state, action) => {
      const { orderId, reason } = action.payload;
      const order = state.orders.find(order => order.id === orderId);
      if (order) {
        order.status = 'Cancelled';
        order.cancellationReason = reason;
        order.cancelledAt = new Date().toISOString();
        order.lastUpdated = new Date().toISOString();
      }
    },
    returnOrder: (state, action) => {
      const { orderId, reason } = action.payload;
      const order = state.orders.find(order => order.id === orderId);
      if (order) {
        order.status = 'Returned';
        order.returnReason = reason;
        order.returnedAt = new Date().toISOString();
        order.lastUpdated = new Date().toISOString();
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
  },
});

export const {
  addOrder,
  updateOrderStatus,
  setCurrentOrder,
  reorder,
  cancelOrder,
  returnOrder,
  setLoading,
  setError,
  clearError,
  setOrders,
  // Socket event actions
  handleOrderCreated,
  handleOrderStatusUpdated,
  handleOrderAssigned,
  handleOrderDelivered,
} = orderSlice.actions;

export default orderSlice.reducer;

