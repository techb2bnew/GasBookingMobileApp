import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants';

// Screens
import ProductsScreen from '../screens/ProductsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import SupportScreen from '../screens/SupportScreen';
import TrackingScreen from '../screens/TrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          // paddingBottom: Platform.OS === 'ios' ? 15 : 15,
          paddingTop: 18,
          height: Platform.OS === 'ios' ? 80 : 75,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 0,
          marginHorizontal: 16,
          marginVertical: Platform.OS === 'ios' ? 10 : 5,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          // borderRightWidth: 1,
          // borderRightColor: COLORS.border,
        },
        tabBarIconStyle: {
          // marginTop: 4,
        },
      }}>
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        // options={{
        //   tabBarLabel: ({ focused }) => (
        //     <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
        //       Home
        //     </Text>
        //   ),
        //   tabBarIcon: ({ color, size, focused }) => (
        //     <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
        //       <Icon name="home" color={color} size={focused ? 26 : 24} />
        //     </View>
        //   ),
        // }}
        options={{
          tabBarLabel: () => null, // Hide default label
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Icon name="home" color={color} size={focused ? 26 : 24} />
              <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
                Home
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        // options={{
        //   tabBarLabel: ({ focused }) => (
        //     <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
        //       Orders
        //     </Text>
        //   ),
        //   tabBarIcon: ({ color, size, focused }) => (
        //     <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
        //       <Icon name="list-alt" color={color} size={focused ? 26 : 24} />
        //     </View>
        //   ),
        // }}
        options={{
          tabBarLabel: () => null, // Hide default label
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Icon name="list-alt" color={color} size={focused ? 26 : 24} />
              <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
                Orders
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Tracking"
        component={TrackingScreen}
        // options={{
        //   tabBarLabel: ({ focused }) => (
        //     <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
        //       Tracking
        //     </Text>
        //   ),
        //   tabBarIcon: ({ color, size, focused }) => (
        //     <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
        //       <Icon name="local-shipping" color={color} size={focused ? 26 : 24} />
        //     </View>
        //   ),
        // }}
        options={{
          tabBarLabel: () => null, // Hide default label
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Icon name="local-shipping" color={color} size={focused ? 26 : 24} />
              <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
                Tracking
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Support"
        component={SupportScreen}
        // options={{
        //   tabBarLabel: ({ focused }) => (
        //     <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
        //       Support
        //     </Text>
        //   ),
        //   tabBarIcon: ({ color, size, focused }) => (
        //     <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
        //       <Icon name="help-outline" color={color} size={focused ? 26 : 24} />
        //     </View>
        //   ),
        // }}
        options={{
          tabBarLabel: () => null, // Hide default label
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Icon name="help-outline" color={color} size={focused ? 26 : 24} />
              <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
                Support
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        // options={{
        //   tabBarLabel: ({ focused }) => (
        //     <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
        //       Profile
        //     </Text>
        //   ),
        //   tabBarIcon: ({ color, size, focused }) => (
        //     <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
        //       <Icon name="person" color={color} size={focused ? 26 : 24} />
        //     </View>
        //   ),
        // }}
        options={{
          tabBarLabel: () => null, // Hide default label
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Icon name="person" color={color} size={focused ? 26 : 24} />
              <Text style={[styles.tabLabel, focused && styles.activeTabLabel]}>
                Profile
              </Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
    iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    // paddingHorizontal: 12,
    borderRadius: 13,
    minWidth: 55,
    minHeight: 55,
  },
  activeIconContainer: {
    backgroundColor: COLORS.primary + '40',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 6,
    // elevation: 3,
  },
    tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default TabNavigator;

