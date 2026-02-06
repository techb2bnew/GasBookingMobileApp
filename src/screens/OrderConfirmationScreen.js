import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { COLORS, STRINGS } from '../constants';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { orderId, order: orderFromParams } = route.params || {};
  const orderFromRedux = useSelector(state =>
    orderId ? state.orders.orders.find(o => o.id === orderId || o.orderId === orderId) : null
  );
  // Use order from params first (just placed), else from Redux (e.g. reopened screen)
  const order = orderFromParams ?? orderFromRedux;

  // Handle all types of back navigation to redirect to home page
  useFocusEffect(
    React.useCallback(() => {
      // Handle Hardware back button (Android physical back button)
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'Main',
            params: {
              screen: 'Products',
            },
          })
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Also handle any other navigation events that might indicate back behavior
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Prevent default behavior
        e.preventDefault();
        // Navigate to home instead
        navigation.dispatch(
          CommonActions.navigate({
            name: 'Main',
            params: {
              screen: 'Products',
            },
          })
        );
      });

      return () => {
        subscription?.remove();
        unsubscribe();
      };
    }, [navigation])
  );

  // useEffect(() => {
  //   // Auto navigate to orders after 5 seconds (keeping original behavior for social proof)
  //   const timer = setTimeout(() => {
  //     navigation.navigate('Main', { screen: 'Orders' });
  //   }, 5000);

  //   return () => clearTimeout(timer);
  // }, [navigation]);

  // if (!order) {
  //   return (
  //     <View style={styles.container}>
  //       <Text style={styles.errorText}>Order not found</Text>
  //     </View>
  //   );
  // }

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

  // Handle case when order is not found (e.g. API failed, or screen opened without order)
  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Order Not Foundddd</Text>
          <Text style={styles.errorMessage}>
            The order you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Main')}>
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={60} color={COLORS.white} />
          </View>
          <Text style={styles.title}>{STRINGS.orderConfirmed}</Text>
          <Text style={styles.subtitle}>
            Your order has been placed successfully!
          </Text>
        </View>

        {/* Order Details */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderIdContainer}>
              <Ionicons name="receipt" size={20} color={COLORS.primary} />
              <Text style={styles.orderIdLabel}>Order ID</Text>
            </View>
            <Text style={styles.orderIdValue}>#{order.id}</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.orderDetail}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar" size={16} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Order Date:</Text>
              </View>
              <Text style={styles.detailValue}>{formatDate(order.orderDate)}</Text>
            </View>

            <View style={styles.orderDetail}>
              <View style={styles.detailIconContainer}>
                <Ionicons 
                  name={order.deliveryMode === 'pickup' ? 'storefront' : 'home'} 
                  size={16} 
                  color={COLORS.primary} 
                />
                <Text style={styles.detailLabel}>Delivery Mode:</Text>
              </View>
              <Text style={styles.detailValue}>
                {order.deliveryMode === 'pickup' ? 'Pickup from Agency' : 'Home Delivery'}
              </Text>
            </View>

            <View style={styles.orderDetail}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="card" size={16} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Payment Method:</Text>
              </View>
              <Text style={styles.detailValue}>
                {order.deliveryMode === 'pickup' ? 'Cash on Pickup' : 'Cash on Delivery'}
              </Text>
            </View>
          </View>

          {/* Show address only for home delivery */}
          {order.deliveryMode === 'home_delivery' && order.address && (
            <View style={styles.orderDetail}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Delivery Address:</Text>
              </View>
              <Text style={styles.detailValue}>
                {order.address.title}{"\n"}
                {order.address.address}{"\n"}
                {order.address.city}, {order.address.pincode}
              </Text>
            </View>
          )}

          {/* Show agency information for both delivery modes */}
          {order.agency && (
            <View style={styles.agencyCard}>
              <View style={styles.agencyHeader}>
                <Ionicons name="business" size={20} color={COLORS.primary} />
                <Text style={styles.agencyTitle}>
                  {order.deliveryMode === 'pickup' ? 'Pickup Agency' : 'Delivery Agency'}
                </Text>
              </View>
              <View style={styles.agencyDetails}>
                <Text style={styles.agencyName}>{order.agency.name}</Text>
                <View style={styles.agencyInfo}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.agencyAddress}>
                    {order.agency.address}, {order.agency.city}, {order.agency.pincode}
                  </Text>
                </View>
                <View style={styles.agencyInfo}>
                  <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.agencyPhone}>{order.agency.phone}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Show estimated delivery/pickup time */}
          <View style={styles.orderDetail}>
            <View style={styles.detailIconContainer}>
              <Ionicons 
                name={order.deliveryMode === 'pickup' ? 'time' : 'car'} 
                size={16} 
                color={COLORS.primary} 
              />
              <Text style={styles.detailLabel}>
                {order.deliveryMode === 'pickup' ? 'Estimated Pickup:' : 'Estimated Delivery:'}
              </Text>
            </View>
            <Text style={styles.detailValue}>
              {order.deliveryMode === 'pickup' 
                ? 'Ready for pickup within 24-48 hours' 
                : formatDate(order.estimatedDelivery)
              }
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <View style={styles.itemsHeader}>
            <Ionicons name="list" size={20} color={COLORS.primary} />
            <Text style={styles.itemsTitle}>Order Items</Text>
          </View>
          
          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <View key={item.id} style={[styles.orderItem, index === order.items.length - 1 && styles.lastOrderItem]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || item.productName}</Text>
                  <Text style={styles.itemVariant}>
                    {item.weight || item.variantLabel} • Qty: {item.quantity}
                  </Text>
                </View>
                <View style={styles.itemPrice}>
                  <Text style={styles.itemPriceText}>KSh{item.quantity * item.price}</Text>
                  <Text style={styles.itemUnitPrice}>KSh {item.price} each</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <View style={styles.totalContainer}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
              <Text style={styles.totalLabel}>Total Amount</Text>
            </View>
            <Text style={styles.totalAmount}>KSh {order.totalAmount}</Text>
          </View>
        </View>

        {/* Status Info */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.statusTitle}>What's Next?</Text>
          </View>
          <View style={styles.statusList}>
            {order.deliveryMode === 'pickup' ? (
              <>
                <View style={styles.statusItem}>
                  <Ionicons name="construct" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>Your order is being prepared at the agency</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="notifications" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>You will receive updates on order status</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="eye" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>Track your order in the Orders section</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="card" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>Payment will be collected on pickup</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="id-card" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>Please bring a valid ID for verification</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.statusItem}>
                  <Ionicons name="construct" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>Your order is being processed</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="notifications" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>You will receive updates on order status</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="eye" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>Track your order in the Orders section</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="card" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>Payment will be collected on delivery</Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="home" size={16} color={COLORS.blue} />
                  <Text style={styles.statusText}>Please ensure someone is available to receive the order</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {order.deliveryMode !== 'pickup' &&
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}>
            <Ionicons name="eye" size={20} color={COLORS.white} />
            <Text style={styles.trackButtonText}>{STRINGS.trackOrder}</Text>
          </TouchableOpacity>
          }
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Main')}>
            <Ionicons name="storefront" size={20} color={COLORS.primary} />
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
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: wp('5%'),
    marginBottom: spacing.lg,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  orderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
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
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp('1.25%'),
  },
  orderIdLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: spacing.xs,
  },
  orderIdValue: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  detailsContainer: {
    marginBottom: spacing.md,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  detailIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  // Agency Card Styles
  agencyCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  agencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  agencyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: spacing.xs,
  },
  agencyDetails: {
    marginLeft: spacing.lg,
  },
  agencyName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: spacing.xs,
  },
  agencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  agencyAddress: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  agencyPhone: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: spacing.xs,
  },
  itemsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: spacing.xs,
  },
  itemsList: {
    marginBottom: spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastOrderItem: {
    borderBottomWidth: 0,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: spacing.xs,
  },
  itemVariant: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  itemPriceText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemUnitPrice: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: spacing.xs,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: spacing.xs,
  },
  statusList: {
    marginLeft: spacing.lg,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginLeft: spacing.xs,
  },
  continueButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginLeft: spacing.xs,
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
  // Error handling styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.lg,
    marginBottom: spacing.xl,
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  homeButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});

export default OrderConfirmationScreen;

