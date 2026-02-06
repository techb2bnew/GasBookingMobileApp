import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import SplashScreen from '../screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import StackNavigator from './StackNavigator';

// Export navigation ref so it can be used in App.js for notification handling
export const navigationRef = React.createRef();

const AppNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for 3 seconds every time app starts
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <StackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;

