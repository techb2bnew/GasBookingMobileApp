import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS, STRINGS } from '../constants';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const order = useSelector(state =>
    state.orders.orders.find(order => order.id === orderId)
  );

  useEffect(() => {
    // Auto navigate to orders after 5 seconds
    const timer = setTimeout(() => {
      navigation.navigate('Orders');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation]);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const formatDate = (dateString) => {
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>

        <Text style={styles.title}>{STRINGS.orderConfirmed}</Text>
        <Text style={styles.subtitle}>
          Your order has been placed successfully!
        </Text>

        {/* Order Details */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderIdValue}>#{order.id}</Text>
          </View>

          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Order Date:</Text>
            <Text style={styles.detailValue}>{formatDate(order.orderDate)}</Text>
          </View>

          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Delivery Type:</Text>
            <Text style={styles.detailValue}>{order.deliveryType}</Text>
          </View>

          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>{order.paymentMethod}</Text>
          </View>

          {order.address && (
            <View style={styles.orderDetail}>
              <Text style={styles.detailLabel}>Delivery Address:</Text>
              <Text style={styles.detailValue}>
                {order.address.title}{"\n"}
                {order.address.address}{"\n"}
                {order.address.city}, {order.address.pincode}
              </Text>
            </View>
          )}

          <View style={styles.orderDetail}>
            <Text style={styles.detailLabel}>Estimated Delivery:</Text>
            <Text style={styles.detailValue}>{formatDate(order.estimatedDelivery)}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>Order Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                Qty: {item.quantity} × ₹{item.price} = ₹{item.quantity * item.price}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
          </View>
        </View>

        {/* Status Info */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>What's Next?</Text>
          <Text style={styles.statusText}>
            • Your order is being processed{"\n"}
            • You will receive updates on order status{"\n"}
            • Track your order in the Orders section{"\n"}
            • Payment will be collected on delivery
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => navigation.navigate('OrderTracking', { orderId: orderId })}>
            <Text style={styles.trackButtonText}>{STRINGS.trackOrder}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Main')}>
            <Text style={styles.continueButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.autoRedirectText}>
          You will be redirected to orders in a few seconds...
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  successIconText: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  orderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderIdLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  orderIdValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  itemsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  orderItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  itemDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  trackButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  autoRedirectText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default OrderConfirmationScreen;

