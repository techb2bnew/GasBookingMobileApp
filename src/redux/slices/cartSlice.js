import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  deliveryType: 'Home Delivery',
  paymentMethod: 'Cash on Delivery',
  selectedAddress: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      
      // Create a unique key for the product based on its properties
      const productKey = `${product.id}_${product.weight || 'default'}_${product.type || 'default'}_${product.category || 'default'}`;
      
      const existingItem = state.items.find(item => {
        const itemKey = `${item.id}_${item.weight || 'default'}_${item.type || 'default'}_${item.category || 'default'}`;
        return itemKey === productKey;
      });
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          ...product,
          quantity,
        });
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    removeFromCart: (state, action) => {
      const { productId, weight, category, type } = action.payload;
      
      console.log('Removing from cart:', { productId, weight, category, type });
      console.log('Current cart items:', state.items);
      
      // If specific details are provided, remove that specific variant
      if (weight || category || type) {
        const targetKey = `${productId}_${weight || 'default'}_${type || 'default'}_${category || 'default'}`;
        console.log('Target key for removal:', targetKey);
        
        state.items = state.items.filter(item => {
          const itemKey = `${item.id}_${item.weight || 'default'}_${item.type || 'default'}_${item.category || 'default'}`;
          const shouldKeep = itemKey !== targetKey;
          console.log('Item key:', itemKey, 'Should keep:', shouldKeep);
          return shouldKeep;
        });
      } else {
        // Fallback to old behavior if only productId is provided
        console.log('Using fallback removal for productId:', productId);
        state.items = state.items.filter(item => item.id !== productId);
      }
      
      console.log('Cart items after removal:', state.items);
      cartSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity, weight, category, type } = action.payload;
      
      console.log('Updating quantity:', { productId, quantity, weight, category, type });
      
      // If specific details are provided, update that specific variant
      if (weight || category || type) {
        const targetKey = `${productId}_${weight || 'default'}_${type || 'default'}_${category || 'default'}`;
        console.log('Target key for quantity update:', targetKey);
        
        const item = state.items.find(item => {
          const itemKey = `${item.id}_${item.weight || 'default'}_${item.type || 'default'}_${item.category || 'default'}`;
          return itemKey === targetKey;
        });
        
        if (item) {
          console.log('Found item for quantity update:', item);
          if (quantity <= 0) {
            console.log('Removing item due to quantity <= 0');
            state.items = state.items.filter(item => {
              const itemKey = `${item.id}_${item.weight || 'default'}_${item.type || 'default'}_${item.category || 'default'}`;
              return itemKey !== targetKey;
            });
          } else {
            console.log('Updating quantity from', item.quantity, 'to', quantity);
            item.quantity = quantity;
          }
        } else {
          console.log('Item not found for quantity update');
        }
      } else {
        // Fallback to old behavior if only productId is provided
        console.log('Using fallback quantity update for productId:', productId);
        const item = state.items.find(item => item.id === productId);
        
        if (item) {
          if (quantity <= 0) {
            state.items = state.items.filter(item => item.id !== productId);
          } else {
            item.quantity = quantity;
          }
        }
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalItems = 0;
    },
    setDeliveryType: (state, action) => {
      state.deliveryType = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setDeliveryType,
  setPaymentMethod,
  setSelectedAddress,
  calculateTotals,
} = cartSlice.actions;

export default cartSlice.reducer;

