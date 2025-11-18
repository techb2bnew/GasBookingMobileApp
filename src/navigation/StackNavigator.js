import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants';

// Screens
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import AgencySelectionScreen from '../screens/AgencySelectionScreen';

// Navigation
import TabNavigator from './TabNavigator';
import ProductsScreen from '../screens/ProductsScreen';
import OngoingOrderDetails from '../screens/OngoingOrderDetails';
import OrdersScreen from '../screens/OrdersScreen';

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OngoingOrder" component={OngoingOrderDetails} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="AgencySelection" component={AgencySelectionScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;

