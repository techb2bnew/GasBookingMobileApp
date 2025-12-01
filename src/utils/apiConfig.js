import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../redux/store';
import { logout, tokenExpired } from '../redux/slices/authSlice';
import { STRINGS } from '../constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: STRINGS.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log("tokentoken",token);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Clear stored token
        await AsyncStorage.multiRemove(['userToken', 'authToken', 'userId', 'userRole', 'agencyId']);
        
        // Dispatch tokenExpired action to clear Redux state with appropriate message
        store.dispatch(tokenExpired());
        
        console.log('✅ Token expired. User logged out automatically. All auth data cleared.');
        
        // You can also show a toast or alert here if needed
        // Alert.alert('Session Expired', 'Your session has expired. Please login again.');
        
        // Optional: You can add a global event emitter here to notify components
        // import { DeviceEventEmitter } from 'react-native';
        // DeviceEventEmitter.emit('tokenExpired');
        
      } catch (storageError) {
        console.error('Error clearing token from storage:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
