import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  categories: ['All', 'LPG', 'Accessories'],
  selectedCategory: 'All',
  loading: false,
  error: null,
  needsRefresh: false,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearRefreshFlag: (state) => {
      state.needsRefresh = false;
    },
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    addProduct: (state, action) => {
      state.products.push(action.payload);
    },
    updateProductAvailability: (state, action) => {
      const { productId, agencyId, isActive, stock, action: updateAction } = action.payload;
      
      console.log('🔄 Redux: updateProductAvailability called with:', {
        productId,
        agencyId,
        isActive,
        updateAction,
        currentProductsCount: state.products.length,
        currentProducts: state.products.map(p => ({ id: p.id, name: p.productName }))
      });
      
      // Find the product in the current state
      const productIndex = state.products.findIndex(product => product.id === productId);
      
      console.log('🔄 Redux: Product found at index:', productIndex);
      
      if (productIndex !== -1) {
        // Product exists in the list
        if (isActive) {
          // Product is active - keep it in the list (do nothing)
          console.log('🔄 Redux: Product is active, keeping in list');
        } else {
          // Product is inactive - remove it from the list
          console.log('🔄 Redux: Removing inactive product from list');
          const removedProduct = state.products.splice(productIndex, 1)[0];
          console.log('🔄 Redux: Removed product:', removedProduct?.productName);
          console.log('🔄 Redux: Products after removal:', state.products.length);
          console.log('🔄 Redux: Remaining products:', state.products.map(p => ({ id: p.id, name: p.productName })));
          
          // Force a state update by creating a new array reference
          state.products = [...state.products];
          
          // If no products left, clear the array completely
          if (state.products.length === 0) {
            console.log('🔄 Redux: All products removed, clearing state');
            state.products = [];
          }
        }
      } else {
        // Product not found in the list
        if (isActive) {
          // Product is active but not in list - this means it was just activated
          // We need to trigger a re-fetch to get the product data
          console.log('🔄 Redux: Product is active but not in list, will trigger re-fetch');
          // Set a flag to trigger re-fetch in the component
          state.needsRefresh = true;
        } else {
          // Product is inactive and not in list - nothing to do
          console.log('🔄 Redux: Product is inactive and not in list, nothing to do');
        }
      }
    },
  },
});

export const {
  setSelectedCategory,
  setLoading,
  setError,
  clearError,
  clearRefreshFlag,
  setProducts,
  addProduct,
  updateProductAvailability,
} = productSlice.actions;

export default productSlice.reducer;

