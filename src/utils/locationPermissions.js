import { Platform, Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Import Geolocation with fallback
let Geolocation;
try {
  Geolocation = require('@react-native-community/geolocation').default;
  console.log('Geolocation library loaded successfully');
} catch (error) {
  console.log('@react-native-community/geolocation not installed:', error);
  Geolocation = null;
}

export const requestLocationPermission = async () => {
  try {
    let permission;
    
    if (Platform.OS === 'ios') {
      permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    } else {
      permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    }

    const result = await request(permission);
    
    switch (result) {
      case RESULTS.GRANTED:
        console.log('Location permission granted');
        return true;
      case RESULTS.DENIED:
        console.log('Location permission denied');
        return false;
      case RESULTS.BLOCKED:
        console.log('Location permission blocked');
        showPermissionAlert();
        return false;
      case RESULTS.UNAVAILABLE:
        console.log('Location permission unavailable');
        return false;
      default:
        return false;
    }
  } catch (error) {
    console.log('Permission request error:', error);
    return false;
  }
};

export const checkLocationPermission = async () => {
  try {
    let permission;
    
    if (Platform.OS === 'ios') {
      permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    } else {
      permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    }

    const result = await permission;
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.log('Permission check error:', error);
    return false;
  }
};

const showPermissionAlert = () => {
  Alert.alert(
    'Location Permission Required',
    'This app needs location access to show your delivery address on map and track orders. Please enable location permission in settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Open Settings', 
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        }
      }
    ]
  );
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    console.log('getCurrentLocation called, Geolocation available:', !!Geolocation);
    
    if (!Geolocation) {
      reject(new Error('Geolocation library not installed. Please install @react-native-community/geolocation'));
      return;
    }

    console.log('Requesting location with Geolocation...');
    
    // Add a timeout wrapper
    const timeoutId = setTimeout(() => {
      console.log('Location request timed out after 15 seconds');
      reject(new Error('Location request timed out. Please check your GPS and try again.'));
    }, 15000);
    
    Geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        console.log('Location obtained successfully:', { latitude, longitude });
        resolve({ latitude, longitude });
      },
      (error) => {
        clearTimeout(timeoutId);
        console.log('Location error details:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = `Unknown location error: ${error.message}`;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: false, // Changed to false for faster response
        timeout: 10000, // Reduced timeout to 10 seconds
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
};
