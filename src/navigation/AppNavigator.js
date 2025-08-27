import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import AuthNavigator from './AuthNavigator';
import StackNavigator from './StackNavigator';

const AppNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <NavigationContainer>
      {isAuthenticated ? <StackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;

