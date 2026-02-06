import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Clipboard,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS, STRINGS} from '../constants';
import {wp, hp, fontSize, spacing, borderRadius} from '../utils/dimensions';
import apiClient from '../utils/apiConfig';
import {addOrder} from '../redux/slices/orderSlice';
import {clearCart} from '../redux/slices/cartSlice';

const OrderDetailsScreen = ({navigation, route}) => {
  const routeParams = route?.params || {};
  const {order: routeOrder, orderId, orderNumber} = routeParams;
  const [order, setOrder] = useState(routeOrder);
  console.log('OrderDetailsScreen - route params:', routeParams);
  console.log('OrderDetailsScreen - order:', order);
  const dispatch = useDispatch();

  const {products} = useSelector(state => state.products);
  const {token} = useSelector(state => state.auth);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch order by orderId if passed via route params (from notification)
  useEffect(() => {
    const fetchOrderFromParams = async (retryCount = 0) => {
      // If orderId is provided but order object is not, fetch it
      if (orderId && !order) {
        console.log('Fetching order from notification orderId:', orderId, 'Retry:', retryCount);
        setLoading(true);
        try {
          if (!token) {
            console.error('No auth token found');
            // Retry after delay in case token is being set
            if (retryCount < 2) {
              setTimeout(() => {
                fetchOrderFromParams(retryCount + 1);
              }, 1000);
            } else {
              setLoading(false);
            }
            return;
          }

          const response = await apiClient.get(`/api/orders/${orderId}`);
          if (response.data?.success && response.data?.data?.order) {
            setOrder(response.data.data.order);
            console.log('Order fetched successfully:', response.data.data.order.orderNumber);
            setLoading(false);
          } else {
            console.error('Failed to fetch order');
            // Retry up to 3 times with delay
            if (retryCount < 3) {
              setTimeout(() => {
                fetchOrderFromParams(retryCount + 1);
              }, 1000 * (retryCount + 1)); // 1s, 2s, 3s delays
            } else {
              console.error('Max retries reached, order fetch failed');
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('Error fetching order from params:', error);
          // Retry up to 3 times with delay
          if (retryCount < 3) {
            setTimeout(() => {
              fetchOrderFromParams(retryCount + 1);
            }, 1000 * (retryCount + 1));
          } else {
            console.error('Max retries reached, order fetch failed');
            setLoading(false);
          }
        }
      } else if (!orderId && !order) {
        // No orderId in params and no order - don't show anything
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    fetchOrderFromParams();
  }, [orderId, order, navigation, token]);

  // Don't render screen if order is not available (no empty/default values)
  // Only render when order is successfully fetched
  if (!order) {
    // Return empty view - no error, no loading, no empty values
    return <View style={{ flex: 1, backgroundColor: COLORS.background || '#ffffff' }} />;
  }

  // Get product image from Redux products state
  const getProductImage = productId => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const imageUrl = product.image || product.imageUrl || product.images?.[0];
      return imageUrl;
    }
    return null;
  };

  // Get product name from Redux products state
  const getProductName = productId => {
    const product = products.find(p => p.id === productId);
    if (product) {
      return product.name || product.productName || product.title;
    }
    return null;
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyle = status => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'confirmed':
      case 'accepted':
        return styles.statusAccepted;
      case 'assigned':
      case 'out_for_delivery':
        return styles.statusOutForDelivery;
      case 'delivered':
        return styles.statusDelivered;
      case 'cancelled':
        return styles.statusCancelled;
      case 'returned':
        return styles.statusReturned;
      default:
        return {};
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'assigned':
        return 'Assigned';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  // Handle view agent
  const handleViewAgent = agent => {
    setCurrentAgent(agent);
    setAgentModalVisible(true);
  };

  // Handle call agent
  const handleCallAgent = phoneNumber => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    // Clean phone number - remove spaces, dashes, etc.
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

    console.log('Attempting to call:', cleanPhoneNumber);

    // Show confirmation dialog first
    Alert.alert('Call Agent', `Do you want to call ${cleanPhoneNumber}?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Call',
        onPress: () => {
          // Simple direct approach - try to open phone dialer
          const makePhoneCall = () => {
            console.log('Making phone call to:', cleanPhoneNumber);

            // Try different approaches
            const approaches = [
              () => Linking.openURL(`tel:${cleanPhoneNumber}`),
              () => Linking.openURL(`tel://${cleanPhoneNumber}`),
              () => Linking.openURL(`tel:+91${cleanPhoneNumber}`),
              () =>
                Linking.openURL(
                  `tel:+91${cleanPhoneNumber.replace(/^91/, '')}`,
                ),
              () =>
                Linking.openURL(
                  `tel:+91${cleanPhoneNumber.replace(/^\+91/, '')}`,
                ),
            ];

            let currentApproach = 0;

            const tryNextApproach = () => {
              if (currentApproach >= approaches.length) {
                // All approaches failed, show manual option
                Alert.alert(
                  'Call Agent',
                  `Unable to open phone dialer automatically.\n\nPlease manually call: ${cleanPhoneNumber}`,
                  [
                    {
                      text: 'Copy Number',
                      onPress: () => {
                        Clipboard.setString(cleanPhoneNumber);
                        Alert.alert(
                          'Copied!',
                          'Phone number copied to clipboard.',
                        );
                      },
                    },
                    {
                      text: 'OK',
                      style: 'default',
                    },
                  ],
                );
                return;
              }

              approaches[currentApproach]()
                .then(() => {
                  console.log(`Approach ${currentApproach + 1} succeeded`);
                })
                .catch(error => {
                  console.log(
                    `Approach ${currentApproach + 1} failed:`,
                    error.message,
                  );
                  currentApproach++;
                  tryNextApproach();
                });
            };

            tryNextApproach();
          };

          makePhoneCall();
        },
      },
    ]);
  };

  // Handle close agent modal
  const handleCloseAgentModal = () => {
    setAgentModalVisible(false);
    setCurrentAgent(null);
  };

  const renderOrderInfo = () => {
    if (!order) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Order Number</Text>
            <Text style={styles.infoValue}>#{order?.orderNumber || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{formatDate(order?.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, getStatusStyle(order?.status)]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{getStatusText(order?.status)}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Payment Status</Text>
            <Text
              style={[
                styles.infoValue,
                {color: order?.paymentReceived ? COLORS.success : COLORS.warning},
              ]}>
              {order?.paymentReceived ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCustomerInfo = () => {
    if (!order) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{order?.customerName || 'N/A'}</Text>
          </View>
          {order?.customerPhone && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <TouchableOpacity
                onPress={() => handleCallAgent(order?.customerPhone)}>
                <Text style={[styles.infoValue, styles.phoneNumber]}>
                  {order?.customerPhone || 'N/A'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {order?.customerEmail && (
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{order?.customerEmail || 'N/A'}</Text>
            </View>
          </View>
        )}
        {order?.customerAddress && (
          <View style={styles.infoRow}>
            <View style={[styles.infoItem, {flex: 1}]}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoValue}>{order?.customerAddress || 'N/A'}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderProducts = () => {
    if (!order || !order?.items || !Array.isArray(order.items) || order.items.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products ({order.items.length})</Text>
        {order.items.map((item, index) => {
        const productImage = getProductImage(item.productId);
        const productName = getProductName(item.productId) || item.productName;
        return (
          <View key={index} style={styles.productItem}>
            <View style={styles.productImageContainer}>
              {productImage ? (
                <Image
                  source={{uri: productImage}}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons
                    name="cube-outline"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{productName}</Text>
              <Text style={styles.productVariant}>{item.variantLabel}</Text>
              <View style={styles.productMeta}>
                <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
                <Text style={styles.productPrice}>KSH{item.variantPrice}</Text>
              </View>
            </View>
          </View>
        );
      })}
      </View>
    );
  };

  const renderPricing = () => {
    if (!order) return null;

    return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pricing Details</Text>
      <View style={styles.pricingRow}>
        <Text style={styles.pricingLabel}>Subtotal</Text>
        <Text style={styles.pricingValue}>KSH{order?.subtotal || '0'}</Text>
      </View>
      {order?.taxValue && (
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Tax ({order.taxValue}%)</Text>
          <Text style={styles.pricingValue}>KSH{order?.taxAmount || '0'}</Text>
        </View>
      )}
      {order?.platformCharge && (
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Platform Charge</Text>
          <Text style={styles.pricingValue}>KSH{order.platformCharge}</Text>
        </View>
      )}
      {order?.deliveryCharge && (
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Delivery Charge</Text>
          <Text style={styles.pricingValue}>KSH{order.deliveryCharge}</Text>
        </View>
      )}
      {order?.couponCode && (
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>
            Coupon Discount ({order.couponCode})
          </Text>
          <Text style={[styles.pricingValue, {color: COLORS.success}]}>
            -KSH{order?.couponDiscount || '0'}
          </Text>
        </View>
      )}
      <View style={[styles.pricingRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>KSH{order?.totalAmount || '0'}</Text>
      </View>
    </View>
    );
  };

  const renderAgencyInfo = () => {
    if (!order || !order?.agency) return null;

    return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Agency Information</Text>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Agency Name</Text>
          <Text style={styles.infoValue}>{order.agency?.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Phone</Text>
          <TouchableOpacity
            onPress={() => handleCallAgent(order.agency?.phone)}>
            <Text style={[styles.infoValue, styles.phoneNumber]}>
              {order.agency?.phone}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{order.agency?.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>City</Text>
          <Text style={styles.infoValue}>{order.agency?.city}</Text>
        </View>
      </View>
    </View>
    );
  };

  const renderAgentInfo = () => {
    if (!order || !order?.assignedAgent) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Agent</Text>
        <View style={styles.agentCard}>
          <View style={styles.agentInfo}>
            <View style={styles.agentDetailItem}>
              <View style={styles.agentDetailIcon}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.agentDetailInfo}>
                <Text style={styles.agentDetailLabel}>Agent Name</Text>
                <Text style={styles.agentDetailValue}>
                  {order?.assignedAgent?.name || 'N/A'}
                </Text>
              </View>
            </View>

            {order?.assignedAgent?.phone && (
              <View style={styles.agentDetailItem}>
                <View style={styles.agentDetailIcon}>
                  <Ionicons name="call" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.agentDetailInfo}>
                  <Text style={styles.agentDetailLabel}>Phone Number</Text>
                  <TouchableOpacity
                    onPress={() => handleCallAgent(order.assignedAgent.phone)}>
                    <Text style={styles.agentPhoneNumber}>
                      {order.assignedAgent.phone}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {order?.assignedAgent?.vehicleNumber && (
              <View style={styles.agentDetailItem}>
                <View style={styles.agentDetailIcon}>
                  <Ionicons name="car" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.agentDetailInfo}>
                  <Text style={styles.agentDetailLabel}>Vehicle Number</Text>
                  <Text style={styles.agentDetailValue}>
                    {order.assignedAgent.vehicleNumber}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {order?.assignedAgent?.phone && (
            <TouchableOpacity
              style={styles.callAgentButton}
              onPress={() => handleCallAgent(order.assignedAgent.phone)}>
              <Ionicons name="call" size={16} color={COLORS.white} />
              <Text style={styles.callAgentButtonText}>Call Agent</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTimeline = () => {
    if (!order) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Timeline</Text>
        <View style={styles.timeline}>
          {order?.createdAt && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <View>
                  <Text style={styles.timelineLabel}>Order Created</Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(order.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {order?.confirmedAt && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Order Confirmed</Text>
                <Text style={styles.timelineDate}>
                  {formatDate(order.confirmedAt)}
                </Text>
              </View>
            </View>
          )}

          {order?.assignedAt && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Order Assigned</Text>
                <Text style={styles.timelineDate}>
                  {formatDate(order.assignedAt)}
                </Text>
              </View>
            </View>
          )}

          {order?.outForDeliveryAt && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Out for Delivery</Text>
                <Text style={styles.timelineDate}>
                  {formatDate(order.outForDeliveryAt)}
                </Text>
              </View>
            </View>
          )}

          {order?.deliveredAt && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Order Delivered</Text>
                <Text style={styles.timelineDate}>
                  {formatDate(order.deliveredAt)}
                </Text>
              </View>
            </View>
          )}

          {order?.cancelledAt && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Order Cancelled</Text>
                <Text style={styles.timelineDate}>
                  {formatDate(order.cancelledAt)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOrderInfo()}
        {renderCustomerInfo()}
        {renderProducts()}
        {renderPricing()}
        {renderAgencyInfo()}
        {renderAgentInfo()}
        {renderTimeline()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + spacing.lg,
    backgroundColor: COLORS.primary,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 10,
    letterSpacing: -0.5,
    marginBottom: wp('0.5%'),
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.sm,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.blue,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoItem: {
    flex: 1,
    marginRight: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: COLORS.text,
    fontWeight: '700',
  },
  phoneNumber: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.white,
    marginRight: spacing.xs / 2,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
  },
  statusAccepted: {
    backgroundColor: COLORS.info,
  },
  statusOutForDelivery: {
    backgroundColor: COLORS.secondary,
  },
  statusDelivered: {
    backgroundColor: COLORS.success,
  },
  statusCancelled: {
    backgroundColor: COLORS.error,
  },
  statusReturned: {
    backgroundColor: COLORS.warning,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  productImageContainer: {
    width: 50,
    height: 50,
    marginRight: spacing.sm,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: spacing.xs / 2,
  },
  productVariant: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
  },
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border + '30',
  },
  pricingLabel: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
  },
  pricingValue: {
    fontSize: fontSize.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.md,
    color: COLORS.blue,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: fontSize.lg,
    color: COLORS.primary,
    fontWeight: '700',
  },
  agentCard: {
    backgroundColor: COLORS.lightGray + '15',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  agentInfo: {
    marginBottom: spacing.sm,
  },
  agentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  agentDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  agentDetailInfo: {
    flex: 1,
  },
  agentDetailLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  agentDetailValue: {
    fontSize: fontSize.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  agentPhoneNumber: {
    fontSize: fontSize.md,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  callAgentButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.success,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  callAgentButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  timeline: {
    paddingLeft: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: spacing.md,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: fontSize.md,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  timelineDate: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default OrderDetailsScreen;
