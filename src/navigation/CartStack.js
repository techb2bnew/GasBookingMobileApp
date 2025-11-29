import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {COLORS} from '../constants';

// Screens
import CartScreen from '../screens/CartScreen';
import ProductsScreen from '../screens/ProductsScreen';

const Stack = createStackNavigator();

const CartStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: COLORS.background},
      }}>
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
    </Stack.Navigator>
  );
};

export default CartStack;
