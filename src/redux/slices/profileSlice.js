import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRINGS } from '../../constants';
import apiClient from '../../utils/apiConfig';


// Async thunks for address operations
export const fetchAddresses = createAsyncThunk(
  'profile/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetch Addresses API Call:');
      
      const response = await apiClient.get('/api/addresses/');
      
      console.log('Fetch Addresses API Response:', response.data);
      console.log('Full Response Object:', response);
      
      if (response.data && response.data.success) {
        console.log('Addresses Array:', response.data.data.addresses || []);
        return response.data.data.addresses || [];
      } else {
        console.log('API returned success: false');
        return rejectWithValue(response.data?.message || 'Failed to fetch addresses');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }
);

export const addAddressAPI = createAsyncThunk(
  'profile/addAddressAPI',
  async (addressData, { rejectWithValue }) => {
    try {
      console.log('Add Address API Call:');
      console.log('Payload:', addressData);
      
      const response = await apiClient.post('/api/addresses/', addressData);
      
      console.log('Add Address API Response:', response.data);
      
      if (response.data && response.data.success) {
        return response.data.data.address;
      } else {
        const errorMessage = response.data?.message || 'Failed to add address';
        console.log('API Error Message:', errorMessage);
        return rejectWithValue(typeof errorMessage === 'string' ? errorMessage : 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to add address';
      if (error.response?.data?.message) {
        errorMessage = typeof error.response.data.message === 'string' 
          ? error.response.data.message 
          : 'Failed to add address';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateAddressAPI = createAsyncThunk(
  'profile/updateAddressAPI',
  async ({ addressId, addressData }, { rejectWithValue }) => {
    try {
      console.log('Update Address API Call:');
      console.log('Address ID:', addressId);
      console.log('Payload:', addressData);
      
      const response = await apiClient.put(`/api/addresses/${addressId}`, addressData);
      
      console.log('Update Address API Response:', response.data);
      
      if (response.data && response.data.success) {
        // Handle different response structures
        const addressData = response.data.data.address || response.data.data || response.data;
        console.log('Returning address data:', addressData);
        return addressData;
      } else {
        const errorMessage = response.data?.message || 'Failed to update address';
        console.log('API Error Message:', errorMessage);
        return rejectWithValue(typeof errorMessage === 'string' ? errorMessage : 'Failed to update address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to update address';
      if (error.response?.data?.message) {
        errorMessage = typeof error.response.data.message === 'string' 
          ? error.response.data.message 
          : 'Failed to update address';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteAddressAPI = createAsyncThunk(
  'profile/deleteAddressAPI',
  async (addressId, { rejectWithValue }) => {
    try {
      console.log('Delete Address API Call:');
      console.log('Address ID:', addressId);
      
      const response = await apiClient.delete(`/api/addresses/${addressId}`);
      
      console.log('Delete Address API Response:', response.data);
      
      if (response.data && response.data.success) {
        return addressId;
      } else {
        const errorMessage = response.data?.message || 'Failed to delete address';
        console.log('API Error Message:', errorMessage);
        return rejectWithValue(typeof errorMessage === 'string' ? errorMessage : 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to delete address';
      if (error.response?.data?.message) {
        errorMessage = typeof error.response.data.message === 'string' 
          ? error.response.data.message 
          : 'Failed to delete address';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  profile: {
    name: '',
    email: '',
    phone: '',
    profileImage: null,
  },
  addresses: [],
  defaultAddressId: null,
  loading: false,
  error: null,
  addressLoading: false,
  addressError: null,
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
    setProfileImage: (state, action) => {
      state.profile.profileImage = action.payload;
    },
    clearAddresses: (state) => {
      state.addresses = [];
      state.defaultAddressId = null;
    },
    clearAddressError: (state) => {
      state.addressError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch addresses
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.addressLoading = true;
        state.addressError = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addressLoading = false;
        state.addresses = action.payload;
        // Set first address as default if no default is set
        if (action.payload.length > 0 && !state.defaultAddressId) {
          state.defaultAddressId = action.payload[0].id;
        }
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.addressLoading = false;
        state.addressError = action.payload;
      });

    // Add address
    builder
      .addCase(addAddressAPI.pending, (state) => {
        state.addressLoading = true;
        state.addressError = null;
      })
      .addCase(addAddressAPI.fulfilled, (state, action) => {
        state.addressLoading = false;
        state.addresses.push(action.payload);
        // Set as default if it's the first address
        if (state.addresses.length === 1) {
          state.defaultAddressId = action.payload.id;
        }
      })
      .addCase(addAddressAPI.rejected, (state, action) => {
        state.addressLoading = false;
        state.addressError = action.payload;
      });

    // Update address
    builder
      .addCase(updateAddressAPI.pending, (state) => {
        state.addressLoading = true;
        state.addressError = null;
      })
      .addCase(updateAddressAPI.fulfilled, (state, action) => {
        state.addressLoading = false;
        // If API returns empty data object, refetch addresses to get updated data
        if (!action.payload || Object.keys(action.payload).length === 0) {
          // Don't update the state, just mark as successful
          // The UI will show success message and form will close
          console.log('Update successful but no data returned, keeping existing state');
        } else {
          const index = state.addresses.findIndex(addr => addr.id === action.payload.id);
          if (index !== -1) {
            state.addresses[index] = action.payload;
          }
        }
      })
      .addCase(updateAddressAPI.rejected, (state, action) => {
        state.addressLoading = false;
        state.addressError = action.payload;
      });

    // Delete address
    builder
      .addCase(deleteAddressAPI.pending, (state) => {
        state.addressLoading = true;
        state.addressError = null;
      })
      .addCase(deleteAddressAPI.fulfilled, (state, action) => {
        state.addressLoading = false;
        state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
        // Update default address if deleted address was default
        if (state.defaultAddressId === action.payload) {
          state.defaultAddressId = state.addresses.length > 0 ? state.addresses[0].id : null;
        }
      })
      .addCase(deleteAddressAPI.rejected, (state, action) => {
        state.addressLoading = false;
        state.addressError = action.payload;
      });
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
  setProfileImage,
  clearAddresses,
  clearAddressError,
} = profileSlice.actions;

export default profileSlice.reducer;

