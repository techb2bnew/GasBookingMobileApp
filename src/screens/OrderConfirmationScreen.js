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
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';

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
            onPress={() => navigation.navigate("Main", { screen: "Tracking", orderId: orderId })}>
            <Text style={styles.trackButtonText}>{STRINGS.trackOrder}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Main')}>
            <Text style={styles.continueButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>

        {/* <Text style={styles.autoRedirectText}>
          You will be redirected to orders in a few seconds...
        </Text> */}
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
    padding: spacing.lg,
    alignItems: 'center',
  },
  successIcon: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: wp('10%'),
    marginBottom: spacing.lg,
  },
  successIconText: {
    color: COLORS.white,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  orderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
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
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderIdLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: wp('1.25%'),
  },
  orderIdValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  itemsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
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
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: spacing.md,
  },
  orderItem: {
    paddingVertical: wp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  itemDetails: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: wp('0.5%'),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
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
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: fontSize.lg,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  trackButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonText: {
    color: COLORS.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  autoRedirectText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: hp('6.25%'),
  },
});

export default OrderConfirmationScreen;

