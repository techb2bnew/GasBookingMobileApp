import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: {
    name: '',
    email: '',
    phoneNumber: '',
  },
  addresses: [],
  defaultAddressId: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    addAddress: (state, action) => {
      const newAddress = {
        id: Date.now().toString(),
        ...action.payload,
      };
      state.addresses.push(newAddress);
      if (state.addresses.length === 1) {
        state.defaultAddressId = newAddress.id;
      }
    },
    updateAddress: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.addresses.findIndex(addr => addr.id === id);
      if (index !== -1) {
        state.addresses[index] = { ...state.addresses[index], ...updates };
      }
    },
    deleteAddress: (state, action) => {
      const addressId = action.payload;
      state.addresses = state.addresses.filter(addr => addr.id !== addressId);
      if (state.defaultAddressId === addressId) {
        state.defaultAddressId = state.addresses.length > 0 ? state.addresses[0].id : null;
      }
    },
    setDefaultAddress: (state, action) => {
      state.defaultAddressId = action.payload;
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
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  setLoading,
  setError,
  clearError,
} = profileSlice.actions;

export default profileSlice.reducer;

