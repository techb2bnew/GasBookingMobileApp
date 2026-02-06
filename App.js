import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, SafeAreaView, Platform, PermissionsAndroid, Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { store, persistor } from './src/redux/store';
import { AppNavigator } from './src/navigation';
import { COLORS } from './src/constants';
import { requestLocationPermission } from './src/utils/locationPermissions';
import { hp, wp } from './src/utils/dimensions';
import { SocketProvider } from './src/contexts/SocketContext';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';


const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const App = () => {
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

