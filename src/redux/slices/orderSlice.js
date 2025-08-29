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
} = orderSlice.actions;

export default orderSlice.reducer;

