import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Pressable,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS, STRINGS } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geocoder from 'react-native-geocoding';

import { getCurrentLocation } from '../utils/locationPermissions';

const { width: screenWidth } = Dimensions.get('window');

// Initialize Geocoder
Geocoder.init("AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI");

const getCoordinatesFromAddress = async (address) => {
  try {
    const geo = await Geocoder.from(address);
    if (geo.results.length > 0) {
      const location = geo.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng };
    }
    return null;
  } catch (error) {
    console.log("Geocoding error: ", error);
    return null;
  }
};

const TrackingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { orders } = useSelector(state => state.orders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [orderCoordinates, setOrderCoordinates] = useState({});
  // Use only real orders from Redux store
  const displayOrders = orders;

  // Get current location on component mount
  useEffect(() => {
    const fetchCurrentLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
      } catch (error) {
        console.log('Failed to get current location:', error);
        // Set default location (New Delhi)
        setCurrentLocation({
          latitude: 28.6139,
          longitude: 77.2090,
        });
      }
    };

    fetchCurrentLocation();
  }, []);

  // Load coordinates for selected order
  useEffect(() => {
    if (selectedOrder) {
      const loadOrderCoordinates = async () => {
        try {
          const order = orders.find(o => o.id === selectedOrder.id);
          if (!order) return;

          const pickupAddress = 'RedSky Advance Solutions Pvt Ltd, Phase 7, Industrial Area, Mohali, Punjab';
          const destinationAddress = order.address.address;
          
          // Get coordinates for pickup and destination
          const pickupCoords = await getCoordinatesFromAddress(pickupAddress);
          const destinationCoords = await getCoordinatesFromAddress(destinationAddress);
          
          setOrderCoordinates({
            [selectedOrder.id]: {
              pickup: pickupCoords,
              destination: destinationCoords
            }
          });
        } catch (error) {
          console.log('Error loading order coordinates:', error);
        }
      };
      
      loadOrderCoordinates();
    }
  }, [selectedOrder, orders]);

  // Get tracking data based on real order status (synchronous version)
  const getTrackingDataSync = async (orderId) => {
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return null;
    }

    const currentStatus = order.status;

    // Get delivery address from order
    const deliveryAddress = order.address;

    // Generate timeline based on current status
    let timeline = [
      {
        id: 1,
        status: 'Order Placed',
        time: '10:30 AM',
        date: 'Today',
        completed: true,
        description: 'Your order has been confirmed'
      },
      {
        id: 2,
        status: 'Processing',
        time: '11:15 AM',
        date: 'Today',
        completed: ['Accepted', 'Out for Delivery', 'Delivered'].includes(currentStatus),
        description: 'Order is being prepared'
      },
      {
        id: 3,
        status: 'Out for Delivery',
        time: '1:45 PM',
        date: 'Today',
        completed: ['Out for Delivery', 'Delivered'].includes(currentStatus),
        description: 'Rahul is on the way'
      },
      {
        id: 4,
        status: 'Delivered',
        time: '2:30 PM',
        date: 'Today',
        completed: currentStatus === 'Delivered',
        description: 'Order will be delivered'
      }
    ];

    // Add cancellation or return status if applicable
    if (currentStatus === 'Cancelled') {
      timeline.push({
        id: 5,
        status: 'Order Cancelled',
        time: order.cancelledAt ? new Date(order.cancelledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '2:30 PM',
        date: 'Today',
        completed: true,
        description: `Order cancelled: ${order.cancellationReason || 'No reason provided'}`
      });
    } else if (currentStatus === 'Returned') {
      timeline.push({
        id: 5,
        status: 'Order Returned',
        time: order.returnedAt ? new Date(order.returnedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '2:30 PM',
        date: 'Today',
        completed: true,
        description: `Order returned: ${order.returnReason || 'No reason provided'}`
      });
    }

    // Get coordinates from addresses using geocoding
    const pickupAddress = 'RedSky Advance Solutions Pvt Ltd, Phase 7, Industrial Area, Mohali, Punjab';
    const destinationAddress = deliveryAddress.address;
    
    // Get coordinates for pickup and destination
    const pickupCoords = await getCoordinatesFromAddress(pickupAddress);
    const destinationCoords = await getCoordinatesFromAddress(destinationAddress);
    
    // Use fallback coordinates if geocoding fails
    const pickupLocation = {
      address: pickupAddress,
      latitude: pickupCoords?.latitude || 30.7046,
      longitude: pickupCoords?.longitude || 76.7179
    };
    
    const destinationLocation = {
      address: destinationAddress,
      latitude: destinationCoords?.latitude || (30.7046 + 0.01),
      longitude: destinationCoords?.longitude || (76.7179 + 0.01)
    };
    
    return {
      orderId,
      status: currentStatus,
      estimatedDelivery: '2:30 PM',
      pickupLocation,
      destinationLocation,
      deliveryPerson: {
        name: 'Rahul Kumar',
        phone: '+91 98765 43210',
        vehicle: 'DL-01-AB-1234'
      },
      timeline
    };
  };

  // Function to call driver
  const callDriver = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return COLORS.warning;
      case 'Accepted':
        return COLORS.info;
      case 'Out for Delivery':
        return COLORS.secondary;
      case 'Delivered':
        return COLORS.success;
      default:
        return COLORS.gray;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return 'schedule';
      case 'Accepted':
        return 'check-circle';
      case 'Out for Delivery':
        return 'local-shipping';
      case 'Delivered':
        return 'done-all';
      default:
        return 'info';
    }
  };

  const renderOrderCard = (order) => {
    const isSelected = selectedOrder?.id === order.id;

    // For now, use a simple approach - we'll implement proper async loading later
    const getTrackingDataSimple = (orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return null;

      const currentStatus = order.status;
      const deliveryAddress = order.address;

      // Generate timeline based on current status
      let timeline = [
        {
          id: 1,
          status: 'Order Placed',
          time: '10:30 AM',
          date: 'Today',
          completed: true,
          description: 'Your order has been confirmed'
        },
        {
          id: 2,
          status: 'Processing',
          time: '11:15 AM',
          date: 'Today',
          completed: ['Accepted', 'Out for Delivery', 'Delivered'].includes(currentStatus),
          description: 'Order is being prepared'
        },
        {
          id: 3,
          status: 'Out for Delivery',
          time: '1:45 PM',
          date: 'Today',
          completed: ['Out for Delivery', 'Delivered'].includes(currentStatus),
          description: 'Rahul is on the way'
        },
        {
          id: 4,
          status: 'Delivered',
          time: '2:30 PM',
          date: 'Today',
          completed: currentStatus === 'Delivered',
          description: 'Order will be delivered'
        }
      ];

      // Add cancellation or return status if applicable
      if (currentStatus === 'Cancelled') {
        timeline.push({
          id: 5,
          status: 'Cancelled',
          time: '3:00 PM',
          date: 'Today',
          completed: true,
          description: `Order cancelled: ${order.cancellationReason || 'No reason provided'}`
        });
      } else if (currentStatus === 'Returned') {
        timeline.push({
          id: 5,
          status: 'Returned',
          time: '3:00 PM',
          date: 'Today',
          completed: true,
          description: `Order returned: ${order.returnReason || 'No reason provided'}`
        });
      }

      // Get coordinates from state if available, otherwise use fallback
      const orderCoords = orderCoordinates[orderId];
      const pickupAddress = 'RedSky Advance Solutions Pvt Ltd, Phase 7, Industrial Area, Mohali, Punjab';
      
      const pickupLocation = {
        address: pickupAddress,
        latitude: orderCoords?.pickup?.latitude || 30.7046,
        longitude: orderCoords?.pickup?.longitude || 76.7179
      };
      
      const destinationLocation = {
        address: deliveryAddress.address,
        latitude: orderCoords?.destination?.latitude || (30.7046 + 0.01),
        longitude: orderCoords?.destination?.longitude || (76.7179 + 0.01)
      };

      return {
        orderId,
        status: currentStatus,
        estimatedDelivery: '2:30 PM',
        pickupLocation,
        destinationLocation,
        deliveryPerson: {
          name: 'Rahul Kumar',
          phone: '+91 98765 43210',
          vehicle: 'DL-01-AB-1234'
        },
        timeline
      };
    };

    const trackingData = getTrackingDataSimple(order.id);

    if (!trackingData) {
      return (
        <View style={styles.orderCard}>
          <Text style={styles.loadingText}>Loading tracking data...</Text>
        </View>
      );
    }

    return (
      <Pressable
        key={order.id}
        style={[styles.orderCard, isSelected && styles.selectedOrderCard]}
        onPress={() => setSelectedOrder(order)}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Order #{order.id}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.orderDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.orderSummary}>
          <Text style={styles.itemsCount}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.orderTotal}>₹{order.totalAmount}</Text>
        </View>

        {isSelected && (
          <View style={styles.trackingDetails}>
            <View style={styles.deliveryInfo}>
              <Icon name="person" size={20} color={COLORS.primary} />
              <View style={styles.deliveryText}>
                <Text style={styles.deliveryPerson}>{trackingData.deliveryPerson.name}</Text>
                <Text style={styles.deliveryPhone}>{trackingData.deliveryPerson.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => callDriver(trackingData.deliveryPerson.phone)}>
                <Icon name="phone" size={20} color={COLORS.success} />
              </TouchableOpacity>
            </View>

            <View style={styles.estimatedDelivery}>
              <Icon name="access-time" size={16} color={COLORS.textSecondary} />
              <Text style={styles.estimatedText}>
                Estimated delivery: {trackingData.estimatedDelivery}
              </Text>
            </View>

            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: 30.7046,
                longitude: 76.7179,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              zoomEnabled={true}
              scrollEnabled={true}
              rotateEnabled={true}
              pitchEnabled={true}>
              {/* Pickup Location Marker */}
              <Marker
                coordinate={{
                  latitude: trackingData.pickupLocation.latitude,
                  longitude: trackingData.pickupLocation.longitude
                }}
                title="Pickup Location"
                description={trackingData.pickupLocation.address}
                pinColor={COLORS.secondary}
              />
              {/* Destination Marker */}
              <Marker
                coordinate={{
                  latitude: trackingData.destinationLocation.latitude,
                  longitude: trackingData.destinationLocation.longitude
                }}
                title="Destination"
                description={trackingData.destinationLocation.address}
                pinColor={COLORS.success}
              />
              {/* Route from Pickup to Destination */}
              <MapViewDirections
                origin={trackingData.pickupLocation.address}
                destination={trackingData.destinationLocation.address}
                apikey="AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI"
                strokeWidth={4}
                strokeColor={COLORS.primary}
                mode="DRIVING"
                onReady={result => {
                  console.log('Directions ready:', result);
                  console.log('Route distance:', result.distance);
                  console.log('Route duration:', result.duration);
                }}
                onError={errorMessage => {
                  console.log('Directions error:', errorMessage);
                  console.log('Pickup:', trackingData.pickupLocation.address);
                  console.log('Destination:', trackingData.destinationLocation.address);
                  // Fallback to simple polyline if directions fail
                  console.log('Using fallback polyline');
                }}
              />
            </MapView>

            <View style={styles.timeline}>
              <Text style={styles.timelineTitle}>Order Timeline</Text>
              {trackingData.timeline.map((item, index) => (
                <View key={item.id} style={styles.timelineItem}>
                  <View style={styles.timelineIcon}>
                    <Icon
                      name={getStatusIcon(item.status)}
                      size={20}
                      color={item.completed ? COLORS.success : COLORS.lightGray}
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineStatus, item.completed && styles.completedText]}>
                      {item.status}
                    </Text>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                    <Text style={styles.timelineDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedOrder(null)}>
              <Icon name="close" size={16} color={COLORS.white} />
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Tracking</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Icon name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="local-shipping" size={60} color={COLORS.lightGray} />
            <Text style={styles.emptyTitle}>No orders to track</Text>
            <Text style={styles.emptySubtitle}>
              Place an order to start tracking your delivery
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('Main', { screen: "Products" })}>
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            <Text style={styles.sectionTitle}>Your Orders</Text>
            {displayOrders.map(renderOrderCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  ordersContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  orderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedOrderCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trackingDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'relative',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryText: {
    flex: 1,
    marginLeft: 8,
  },
  deliveryPerson: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  deliveryPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  callButton: {
    padding: 8,
  },
  estimatedDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  estimatedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  map: {
    height: 250,
    borderRadius: 8,
    marginBottom: 16,
  },

  timeline: {
    marginTop: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  completedText: {
    color: COLORS.success,
  },
  timelineTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  timelineDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default TrackingScreen;
