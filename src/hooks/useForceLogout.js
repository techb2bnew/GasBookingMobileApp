import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { handleForceLogout } from '../redux/slices/authSlice';
import socketService from '../utils/socketService';

/**
 * Hook to handle force logout events from backend
 * This will:
 * 1. Listen for user:force-logout and agency:force-logout events
 * 2. Clear all auth data from AsyncStorage
 * 3. Dispatch logout to Redux
 * 4. Disconnect socket
 * 5. Show alert to user
 * 6. Navigate to login screen
 */
export const useForceLogout = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    const socket = socketService.socket;
    
    if (!socket) {
      console.log('⚠️ useForceLogout: No socket available');
      return;
    }

    console.log('🔒 useForceLogout: Setting up force logout listeners...');

    const handleLogout = async (data) => {
      const eventData = data.data || data;
      const message = eventData.message || 'Your account has been blocked by admin.';
      const type = eventData.type || 'ACCOUNT_BLOCKED';
      
      console.log('🚫 Force Logout Received!');
      console.log('   Type:', type);
      console.log('   Message:', message);
      
      try {
        // 1. Clear all auth data from AsyncStorage
        await AsyncStorage.multiRemove([
          'authToken',
          'userToken',
          'userId',
          'userRole',
          'agencyId',
          'userData'
        ]);
        console.log('✅ Auth data cleared from AsyncStorage');
        
        // 2. Dispatch to Redux to clear auth state
        dispatch(handleForceLogout(eventData));
        console.log('✅ Redux auth state cleared');
        
        // 3. Disconnect socket
        socketService.disconnect();
        console.log('✅ Socket disconnected');
        
        // 4. Show alert to user
        Alert.alert(
          'Account Alert',
          message,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('User acknowledged - navigating to Auth screen');
                // 5. Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Auth' }],
                });
              }
            }
          ],
          { cancelable: false }
        );
        
      } catch (error) {
        console.error('❌ Error during force logout:', error);
      }
    };

    // Listen to both force logout events
    socket.on('user:force-logout', handleLogout);
    socket.on('agency:force-logout', handleLogout);

    console.log('✅ useForceLogout: Listeners registered');

    // Cleanup
    return () => {
      console.log('🧹 useForceLogout: Cleaning up listeners');
      socket.off('user:force-logout', handleLogout);
      socket.off('agency:force-logout', handleLogout);
    };
  }, [dispatch, navigation]);
};

export default useForceLogout;

