import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [
    {
      id: '1',
      name: 'LPG Gas Cylinder - 14.2kg',
      category: 'LPG Cylinder',
      price: 850,
      image: 'https://images.unsplash.com/photo-1644217209694-5ca176114adb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Standard domestic LPG gas cylinder for cooking',
      inStock: true,
      weight: '14.2kg',
    },
    {
      id: '2',
      name: 'LPG Gas Cylinder - 5kg',
      category: 'LPG Cylinder',
      price: 450,
      image: 'https://media.istockphoto.com/id/1336230367/photo/isolated-lpg-cylinder-view-of-liquified-petroleum-gas-in-a-container-for-domestic-use.jpg?s=1024x1024&w=is&k=20&c=unRAAo2RzrElipAplWc8yNS7P30gKnKBj06Jx3pW6gc=',
      description: 'Small LPG gas cylinder for portable use',
      inStock: false,
      weight: '5kg',
    },
    {
      id: '3',
      name: 'Gas Stove - 2 Burner',
      category: 'Accessories',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1527195575508-5b138d14a35b?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'High quality 2 burner gas stove with auto ignition',
      inStock: true,
      features: ['Auto Ignition', 'Brass Burners', 'Toughened Glass Top'],
    },
    {
      id: '4',
      name: 'Gas Regulator',
      category: 'Accessories',
      price: 350,
      image: 'https://media.istockphoto.com/id/1175459823/photo/rusty-pressure-regulator-and-operating-valve-of-cooking-gas-tanks-lpg.jpg?s=1024x1024&w=is&k=20&c=qvSVW6srFQHnLM4-Krg9HKIdISlmacdBJUcacb5j_HE=',
      description: 'ISI marked gas regulator for safe gas connection',
      inStock: true,
      features: ['ISI Marked', 'Safety Valve', 'Leak Proof'],
    },
    {
      id: '5',
      name: 'Gas Pipe - 1.5m',
      category: 'Accessories',
      price: 150,
      image: 'https://images.unsplash.com/photo-1530219451035-fb499f9fc714?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'High quality gas pipe for connecting cylinder to stove',
      inStock: true,
      length: '1.5 meters',
    },
    {
      id: '6',
      name: 'Gas Lighter',
      category: 'Accessories',
      price: 50,
      image: 'https://media.istockphoto.com/id/999841636/photo/gas-lighter-gun-for-gas-stove-candles-campfire-and-barbecue-isolated-on-white-background.jpg?s=1024x1024&w=is&k=20&c=FCUwYgDSAynMwqRSVUyUoyv8uDxkF4bMTLo2CU1WK3M=',
      description: 'Refillable gas lighter for kitchen use',
      inStock: true,
      features: ['Refillable', 'Child Safety Lock', 'Long Lasting'],
    },
  ],
  categories: ['All', 'LPG Cylinder', 'Accessories'],
  selectedCategory: 'All',
  loading: false,
  error: null,
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
  },
});

export const {
  setSelectedCategory,
  setLoading,
  setError,
  clearError,
} = productSlice.actions;

export default productSlice.reducer;

