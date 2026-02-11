import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  deliveryType: 'Home Delivery',
  deliveryMode: 'home_delivery', // 'home_delivery' or 'pickup' - default to home delivery
  paymentMethod: 'Cash on Delivery',
  selectedAddress: null,
  selectedAgency: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, agencyId } = action.payload;
      
      // Store agency ID when first item is added
      if (state.items.length === 0 && agencyId) {
        state.selectedAgency = agencyId;
      }
      
      // Normalize weight for comparison (lowercase, trim whitespace)
      const normalizeWeight = (weight) => {
        if (!weight || weight === 'default') return 'default';
        return String(weight).toLowerCase().trim();
      };
      
      // Normalize other fields for comparison
      const normalizeField = (field) => {
        if (!field || field === 'default') return 'default';
        return String(field).toLowerCase().trim();
      };
      
      const normalizedWeight = normalizeWeight(product.weight);
      const normalizedType = normalizeField(product.type);
      const normalizedCategory = normalizeField(product.category);
      
      // Create a unique key for the product based on its properties
      const productKey = `${product.id}_${normalizedWeight}_${normalizedType}_${normalizedCategory}`;
      
      const existingItem = state.items.find(item => {
        const itemWeight = normalizeWeight(item.weight);
        const itemType = normalizeField(item.type);
        const itemCategory = normalizeField(item.category);
        const itemKey = `${item.id}_${itemWeight}_${itemType}_${itemCategory}`;
        return itemKey === productKey;
      });
      
      if (existingItem) {
        // Product already exists, update quantity
        existingItem.quantity += quantity;
        console.log(`Product already in cart, updating quantity from ${existingItem.quantity - quantity} to ${existingItem.quantity}`);
      } else {
        // New product, add to cart
        state.items.push({
          ...product,
          quantity,
        });
        console.log(`New product added to cart: ${product.id} - ${normalizedWeight}`);
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    removeFromCart: (state, action) => {
      const { productId, weight, category, type } = action.payload;
      
      // Normalize fields for comparison
      const normalizeWeight = (w) => {
        if (!w || w === 'default') return 'default';
        return String(w).toLowerCase().trim();
      };
      const normalizeField = (field) => {
        if (!field || field === 'default') return 'default';
        return String(field).toLowerCase().trim();
      };
      
      console.log('Removing from cart:', { productId, weight, category, type });
      console.log('Current cart items:', state.items);
      
      // If specific details are provided, remove that specific variant
      if (weight || category || type) {
        const normalizedWeight = normalizeWeight(weight);
        const normalizedType = normalizeField(type);
        const normalizedCategory = normalizeField(category);
        const targetKey = `${productId}_${normalizedWeight}_${normalizedType}_${normalizedCategory}`;
        console.log('Target key for removal:', targetKey);
        
        state.items = state.items.filter(item => {
          const itemWeight = normalizeWeight(item.weight);
          const itemType = normalizeField(item.type);
          const itemCategory = normalizeField(item.category);
          const itemKey = `${item.id}_${itemWeight}_${itemType}_${itemCategory}`;
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
      
      // Normalize fields for comparison
      const normalizeWeight = (w) => {
        if (!w || w === 'default') return 'default';
        return String(w).toLowerCase().trim();
      };
      const normalizeField = (field) => {
        if (!field || field === 'default') return 'default';
        return String(field).toLowerCase().trim();
      };
      
      console.log('Updating quantity:', { productId, quantity, weight, category, type });
      
      // If specific details are provided, update that specific variant
      if (weight || category || type) {
        const normalizedWeight = normalizeWeight(weight);
        const normalizedType = normalizeField(type);
        const normalizedCategory = normalizeField(category);
        const targetKey = `${productId}_${normalizedWeight}_${normalizedType}_${normalizedCategory}`;
        console.log('Target key for quantity update:', targetKey);
        
        const item = state.items.find(item => {
          const itemWeight = normalizeWeight(item.weight);
          const itemType = normalizeField(item.type);
          const itemCategory = normalizeField(item.category);
          const itemKey = `${item.id}_${itemWeight}_${itemType}_${itemCategory}`;
          return itemKey === targetKey;
        });
        
        if (item) {
          console.log('Found item for quantity update:', item);
          if (quantity <= 0) {
            console.log('Removing item due to quantity <= 0');
            state.items = state.items.filter(item => {
              const itemWeight = normalizeWeight(item.weight);
              const itemType = normalizeField(item.type);
              const itemCategory = normalizeField(item.category);
              const itemKey = `${item.id}_${itemWeight}_${itemType}_${itemCategory}`;
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
      state.selectedAgency = null;
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
    setDeliveryMode: (state, action) => {
      state.deliveryMode = action.payload;
      // Reset selected agency when switching to home delivery
      if (action.payload === 'home_delivery') {
        state.selectedAgency = null;
      }
    },
    setSelectedAgency: (state, action) => {
      state.selectedAgency = action.payload;
    },
    calculateTotals: (state) => {
      // Count unique products (not quantities)
      state.totalItems = state.items.length;
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
  setDeliveryMode,
  setPaymentMethod,
  setSelectedAddress,
  setSelectedAgency,
  calculateTotals,
} = cartSlice.actions;

export default cartSlice.reducer;

