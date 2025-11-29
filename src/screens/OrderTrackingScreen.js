import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, STRINGS} from '../constants';
import {updateOrderStatus} from '../redux/slices/orderSlice';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';

const OrderTrackingScreen = ({route, navigation}) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {orderId} = route.params;
  const order = useSelector(state =>
    state.orders.orders.find(o => o.id === orderId),
  );
  console.log('ordercus>>>', order);

  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const statusSteps = ['Pending', 'Accepted', 'Out for Delivery', 'Delivered'];

  useEffect(() => {
    
    if (order) {
      const initialIndex = statusSteps.indexOf(order.status);
      setCurrentStatusIndex(initialIndex !== -1 ? initialIndex : 0);
    }
  }, [order]);

  useEffect(() => {
    if (order && order.status !== 'Delivered') {
      const interval = setInterval(() => {
        setCurrentStatusIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < statusSteps.length) {
            const newStatus = statusSteps[nextIndex];
            dispatch(updateOrderStatus({orderId: order.id, status: newStatus}));
            return nextIndex;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [order, dispatch, statusSteps]);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{STRINGS.trackOrder}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.orderId}>Order ID: #{order.id}</Text>
        <Text style={styles.orderDate}>
          Placed on: {formatDate(order.orderDate)}
        </Text>

        {/* Status Timeline */}
        <View style={styles.timelineContainer}>
          {statusSteps.map((step, index) => (
            <View key={step} style={styles.timelineItem}>
              <View
                style={[
                  styles.statusDot,
                  index <= currentStatusIndex && styles.statusDotActive,
                ]}
              />
              {index < statusSteps.length - 1 && (
                <View
                  style={[
                    styles.statusLine,
                    index < currentStatusIndex && styles.statusLineActive,
                  ]}
                />
              )}
              <Text
                style={[
                  styles.statusText,
                  index <= currentStatusIndex && styles.statusTextActive,
                ]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Current Status Details */}
        <View style={styles.currentStatusCard}>
          <Text style={styles.currentStatusLabel}>Current Status:</Text>
          <Text style={styles.currentStatusValue}>{order.status}</Text>
          <Text style={styles.lastUpdatedText}>
            Last Updated: {formatDate(order.lastUpdated || order.orderDate)}
          </Text>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {order.items.map(item => (
            <View key={item.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>{item.name}</Text>
              <Text style={styles.summaryItemDetails}>
                Qty: {item.quantity} × ${item.price}
              </Text>
            </View>
          ))}
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
            <Text style={styles.summaryTotalAmount}>${order.totalAmount}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        {order.deliveryType === 'Home Delivery' && order.address && (
          <View style={styles.deliveryCard}>
            <Text style={styles.deliveryTitle}>Delivery Details</Text>
            <Text style={styles.deliveryLabel}>Delivery Type:</Text>
            <Text style={styles.deliveryValue}>{order.deliveryType}</Text>
            <Text style={styles.deliveryLabel}>Delivery Address:</Text>
            <Text style={styles.deliveryValue}>
              {order.address.title}
              {'\n'}
              {order.address.address}
              {'\n'}
              {order.address.city}, {order.address.pincode}
            </Text>
            <Text style={styles.deliveryLabel}>Estimated Delivery:</Text>
            <Text style={styles.deliveryValue}>
              {formatDate(order.estimatedDelivery)}
            </Text>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Payment Details</Text>
          <Text style={styles.paymentLabel}>Payment Method:</Text>
          <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
        </View>
      </View>
    </ScrollView>
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
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    paddingVertical: 5,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 20,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginBottom: 10,
  },
  statusDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusLine: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.lightGray,
    position: 'absolute',
    top: 7,
    left: '50%',
    zIndex: -1,
  },
  statusLineActive: {
    backgroundColor: COLORS.primary,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
  statusTextActive: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  currentStatusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  currentStatusLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  currentStatusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    fontSize: 14,
    color: COLORS.text,
  },
  summaryItemDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 15,
    marginTop: 10,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
  },
  deliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  deliveryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  deliveryValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 10,
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  paymentValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default OrderTrackingScreen;
