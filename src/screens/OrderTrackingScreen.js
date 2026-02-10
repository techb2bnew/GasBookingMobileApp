import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS, STRINGS } from '../constants';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import {spacing, fontSize, wp} from '../utils/dimensions';

const STATUS_STEPS = ['Pending', 'Accepted', 'Out for Delivery', 'Delivered'];

// Map API status (any case/form) to step index – real status only, no dummy
const getStatusIndex = (status) => {
  if (!status) return 0;
  const s = String(status).toLowerCase().replace(/_/g, ' ');
  if (/pending/i.test(s)) return 0;
  if (/accepted|assigned/i.test(s)) return 1;
  if (/out.*delivery|out for delivery|shipped/i.test(s)) return 2;
  if (/delivered/i.test(s)) return 3;
  return 0;
};

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const order = useSelector(state =>
    state.orders.orders.find(o => o.id === orderId || o.orderId === orderId)
  );

  // Real status from API/Redux only – no dummy updates
  const currentStatusIndex = useMemo(
    () => (order ? getStatusIndex(order.status) : 0),
    [order]
  );
  const statusSteps = STATUS_STEPS;

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  // Same format as Order Details: "06 Feb 2026 at 10:45 AM"
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const placedDate = order?.orderDate || order?.createdAt;
  const lastUpdatedDate = order?.lastUpdated || order?.updatedAt || order?.orderDate || order?.createdAt;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{STRINGS.trackOrder}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Order Header Card */}
        <View style={styles.orderHeaderCard}>
          <View style={styles.orderHeaderTop}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderId} numberOfLines={1} ellipsizeMode="middle">
                #{order.id?.length > 20 ? `${order.id.substring(0, 10)}...${order.id.substring(order.id.length - 8)}` : order.id}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {order.status && typeof order.status === 'string'
                  ? order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                  : order.status || 'Pending'}
              </Text>
            </View>
          </View>
          <View style={styles.orderDateContainer}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.orderDate}>Placed on {formatDate(placedDate)}</Text>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          <View style={styles.timelineContainer}>
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStatusIndex;
              const isCompleted = index < currentStatusIndex;
              return (
                <View key={step} style={styles.timelineItem}>
                  <View style={styles.timelineDotContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        isActive && styles.statusDotActive,
                        isCompleted && styles.statusDotCompleted,
                      ]}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={10} color={COLORS.white} />
                      )}
                    </View>
                    {index < statusSteps.length - 1 && (
                      <View
                        style={[
                          styles.statusLine,
                          isCompleted && styles.statusLineActive,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.statusText,
                      isActive && styles.statusTextActive,
                    ]}
                    numberOfLines={2}>
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Current Status Details */}
        <View style={styles.currentStatusCard}>
          <View style={styles.currentStatusHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.currentStatusLabel}>Current Status</Text>
          </View>
          <Text style={styles.currentStatusValue}>
            {order.status && typeof order.status === 'string'
              ? order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              : order.status || 'Pending'}
          </Text>
          <View style={styles.lastUpdatedContainer}>
            <Ionicons name="refresh-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.lastUpdatedText}>
              Last updated {formatDate(lastUpdatedDate)}
            </Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.text} />
            <Text style={styles.summaryTitle}>Order Summary</Text>
          </View>
          <View style={styles.summaryItemsContainer}>
            {order.items && order.items.map((item, idx) => (
              <View key={item.id || idx} style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <View style={styles.itemDot} />
                  <Text style={styles.summaryItemName}>
                    {item.name || item.productName || 'Item'}
                  </Text>
                </View>
                <Text style={styles.summaryItemDetails}>
                  {item.quantity} × KSH {item.price}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total Amount</Text>
            <Text style={styles.summaryTotalAmount}>KSH {order.totalAmount}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        {order.deliveryType === 'Home Delivery' && order.address && (
          <View style={styles.deliveryCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={20} color={COLORS.text} />
              <Text style={styles.deliveryTitle}>Delivery Details</Text>
            </View>
            <View style={styles.deliveryInfoRow}>
              <Text style={styles.deliveryLabel}>Delivery Type</Text>
              <Text style={styles.deliveryValue}>{order.deliveryType}</Text>
            </View>
            <View style={styles.deliveryInfoRow}>
              <Text style={styles.deliveryLabel}>Address</Text>
              <Text style={styles.deliveryValue}>
                {order.address.title}{"\n"}
                {order.address.address}{"\n"}
                {order.address.city}, {order.address.pincode}
              </Text>
            </View>
            {order.estimatedDelivery && (
              <View style={styles.deliveryInfoRow}>
                <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
                <Text style={styles.deliveryValue}>{formatDate(order.estimatedDelivery)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={20} color={COLORS.text} />
            <Text style={styles.paymentTitle}>Payment Details</Text>
          </View>
          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>
              {order.paymentMethod && typeof order.paymentMethod === 'string'
                ? order.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                : order.paymentMethod || '—'}
            </Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  // Order Header Card
  orderHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: {
    flex: 1,
    marginRight: 12,
  },
  orderIdLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  statusBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  orderDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  // Timeline Card
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timelineItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  timelineDotContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    position: 'relative',
  },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    borderWidth: 3,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  statusDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusDotCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  statusLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    width: '80%',
    height: 3,
    backgroundColor: COLORS.border,
    zIndex: 1,
  },
  statusLineActive: {
    backgroundColor: COLORS.primary,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 14,
    marginTop: 4,
  },
  statusTextActive: {
    fontWeight: '600',
    color: COLORS.text,
  },
  // Current Status Card
  currentStatusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  currentStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  currentStatusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentStatusValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  summaryItemsContainer: {
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  summaryItemName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  summaryItemDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  summaryTotalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  // Delivery Card
  deliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  deliveryInfoRow: {
    marginBottom: 16,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deliveryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  // Payment Card
  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  paymentInfoRow: {
    marginTop: 4,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
    fontWeight: '500',
  },
});

export default OrderTrackingScreen;

