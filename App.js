import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import Orientation from 'react-native-orientation-locker';

import { store, persistor } from './src/redux/store';
import { AppNavigator } from './src/navigation';
import { COLORS } from './src/constants';
import { requestLocationPermission } from './src/utils/locationPermissions';
import { SocketProvider } from './src/contexts/SocketContext';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from './src/navigation/AppNavigator';


const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const App = () => {
  useEffect(() => {
    try {
      if (Orientation && typeof Orientation.lockToPortrait === 'function') {
        Orientation.lockToPortrait();
      }
    } catch (e) {
      console.warn('Orientation lock skipped:', e?.message);
    }
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'ios') {
        await requestUserIosPermission();
      } else {
        await requestNotificationPermission();
      }
    };
    requestPermissions();
  }, []);

  // Handle notification taps (background / quit state)
  useEffect(() => {
    const handleNotificationNavigation = (remoteMessage) => {
      if (!remoteMessage) {
        console.log('Customer app: No remote message received');
        return;
      }

      const data = remoteMessage.data || remoteMessage.notification?.data || {};
      let orderId = data.orderId || data.order_id;
      const notificationType = data.type || '';
      
      // Fallback: Extract order ID from notification text if not in data
      if (!orderId) {
        const notificationBody = remoteMessage.notification?.body || remoteMessage.data?.body || '';
        const orderMatch = notificationBody.match(/#ORD-[\w-]+/);
        if (orderMatch) {
          // Extract order number format (e.g., "ORD-195617-WFWG1N")
          const orderNumber = orderMatch[0].replace('#', '');
          console.log('Extracted order number from notification text:', orderNumber);
          // Try to find orderId from orderNumber (will be handled by screen)
          orderId = orderNumber;
        }
      }

      console.log('Customer app: notification opened:', {
        orderId,
        notificationType,
        data,
        fullMessage: remoteMessage,
      });

      // Function to attempt navigation
      const attemptNavigation = (retryCount = 0) => {
        if (navigationRef.current?.isReady()) {
          try {
            // Check for order-related notifications (ORDER_STATUS, ORDER_CANCELLED, ORDER_ASSIGNED, etc.)
            if (orderId || notificationType?.includes('ORDER')) {
              console.log('Navigating to OrderDetails with orderId:', orderId);
              navigationRef.current.navigate('OrderDetails', {
                orderId: orderId,
                orderNumber: data.orderNumber || data.order_number,
              });
            } else if (notificationType === 'PROMOTION') {
              console.log('Navigating to Home for promotion');
              navigationRef.current.navigate('Main', {
                screen: 'Home',
              });
            } else {
              console.log('Navigating to Orders list');
              navigationRef.current.navigate('Orders');
            }
          } catch (error) {
            console.error('Navigation error:', error);
          }
        } else if (retryCount < 5) {
          // Retry up to 5 times (5 seconds total)
          console.warn(`Navigation not ready yet, retrying... (${retryCount + 1}/5)`);
          setTimeout(() => {
            attemptNavigation(retryCount + 1);
          }, 1000);
        } else {
          console.error('Navigation failed after 5 retries');
        }
      };

      // Start navigation attempt after a short delay
      setTimeout(() => {
        attemptNavigation();
      }, 500);
    };

    // App background me tha, notification tap se open hua
    const unsubscribeFromOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('Customer app: Notification opened from background');
        handleNotificationNavigation(remoteMessage);
      },
    );

    // App quit state se notification se open hua
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Customer app: Notification opened from quit state');
          handleNotificationNavigation(remoteMessage);
        }
      })
      .catch(error => {
        console.error('Error getting initial notification:', error);
      });

    return unsubscribeFromOpened;
  }, []);

  useEffect(() => {
    // Request location permission when app starts
    // requestLocationPermission();
  }, []);
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
      // Android 13+ needs runtime POST_NOTIFICATIONS permission
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app would like to send you notifications.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            getFcmToken();
            console.log('Notification permission granted');
          } else {
            console.log('Notification permission denied');
            Alert.alert(
              'Permission Denied',
              'You will not receive notifications.',
            );
          }
        } catch (err) {
          console.warn('Permission error:', err);
        }
      } else {
        // Android 12 and below: no runtime permission required, just get token
        getFcmToken();
      }
    }
  };
  const requestUserIosPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('iOS Notification permission granted:', authStatus);
      getFcmToken();
    } else {
      console.log('iOS Notification permission denied:', authStatus);
    }
  };

  useEffect(() => {
    // const unsubscribe = messaging().onMessage(async remoteMessage => {
    //   Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    // });
    // return unsubscribe;
  }, []);

  const getFcmToken = async () => {
    try {
      const existingToken = await AsyncStorage.getItem('fcmToken');
      if (existingToken) {
        console.log('FCM token (from storage):', existingToken);
        return existingToken;
      }

      const token = await messaging().getToken();
      console.log("fcmtoken>>",token);
      
      if (token) {
        await AsyncStorage.setItem('fcmToken', token);
        return token;
      }
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  };
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <SocketProvider>
            {/* <SafeAreaView style={{ height:hp(100),width:wp(100) }}> */}
              <AppNavigator />
              <Toast />
            {/* </SafeAreaView> */}
          </SocketProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.text,
  },
});

export default App;

