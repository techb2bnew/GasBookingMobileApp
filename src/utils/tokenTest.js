// Test utility to verify automatic logout functionality
// This file can be used for testing purposes

import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../redux/store';
import { tokenExpired } from '../redux/slices/authSlice';

/**
 * Test function to simulate token expiration
 * This manually triggers the logout process for testing
 */
export const simulateTokenExpiration = async () => {
  try {
    console.log('🧪 Testing: Simulating token expiration...');
    
    // Clear stored token
    await AsyncStorage.removeItem('userToken');
    
    // Dispatch tokenExpired action
    store.dispatch(tokenExpired());
    
    console.log('✅ Test: Token expiration simulation completed');
    console.log('📱 User should now be redirected to login screen');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

/**
 * Test function to check if user is properly logged out
 */
export const checkLogoutStatus = () => {
  const state = store.getState();
  const { isAuthenticated, user, token } = state.auth;
  
  console.log('🔍 Current auth state:');
  console.log('- isAuthenticated:', isAuthenticated);
  console.log('- user:', user);
  console.log('- token:', token);
  
  return !isAuthenticated && !user && !token;
};

/**
 * Test function to verify API client is working
 */
export const testApiClient = async () => {
  try {
    console.log('🧪 Testing: API client functionality...');
    
    // This will fail with 401 if no valid token, triggering automatic logout
    const response = await import('./apiConfig').then(module => 
      module.default.get('/api/auth/profile')
    );
    
    console.log('✅ API client test successful:', response.data);
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ API client correctly handled 401 - automatic logout should trigger');
      return true;
    } else {
      console.error('❌ API client test failed:', error);
      return false;
    }
  }
};
