import { Platform } from 'react-native';

export const testGeolocation = () => {
  console.log('=== Geolocation Test ===');
  console.log('Platform:', Platform.OS);
  
  // Test if geolocation library is available
  try {
    const Geolocation = require('@react-native-community/geolocation').default;
    console.log('✅ Geolocation library found');
    
    // Test if navigator.geolocation is available (web fallback)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      console.log('✅ Web geolocation available');
    } else {
      console.log('❌ Web geolocation not available');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Geolocation library not found:', error.message);
    return false;
  }
};

export const testLocationPermission = async () => {
  console.log('=== Permission Test ===');
  
  try {
    const { request, PERMISSIONS, RESULTS } = require('react-native-permissions');
    console.log('✅ react-native-permissions found');
    
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    
    console.log('Permission type:', permission);
    
    const result = await request(permission);
    console.log('Permission result:', result);
    
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.log('❌ Permission test failed:', error.message);
    return false;
  }
};
