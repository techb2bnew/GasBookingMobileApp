import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, STRINGS } from '../constants';
import { clearCart } from '../redux/slices/cartSlice';
import { addOrder } from '../redux/slices/orderSlice';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';
import { reorder, setCurrentOrder, cancelOrder, returnOrder, setOrders, setLoading, setError } from '../redux/slices/orderSlice';
import { setProducts } from '../redux/slices/productSlice';
import ReasonModal from '../components/ReasonModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiConfig';

const OrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { orders, isLoading, error } = useSelector(state => state.orders);
  const { products } = useSelector(state => state.products);
  const [modalVisible, setModalVisible] = useState(false);
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [reasonsList, setReasonsList] = useState([]);
  const [currentReorderId, setCurrentReorderId] = useState(null);
  
  // Local states for UI
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const cancelReasons = [
    'Customer requested cancellation',
    'Incorrect order details',
    'Item out of stock',
    'Delivery address not serviceable',
    'Other',
  ];

  const returnReasons = [
    'Delay in delivery',
    'Change of mind',
    'Wrong item selected',
    'Found cheaper option',
    'Damaged item',
    'Wrong item delivered',
    'Not satisfied',
    'Other',
  ];

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      console.log('Fetching orders from API...');
      const response = await apiClient.get('/api/orders');

      console.log('Orders API Response:', response.data);

      if (response?.data && response?.data?.success) {
        const ordersData = response?.data?.data?.orders || [];
        dispatch(setOrders(ordersData));
      } else {
        throw new Error(response.data?.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        dispatch(setError('Session expired. Please login again.'));
      } else {
        dispatch(setError(error.response?.data?.message || 'Failed to fetch orders. Please try again.'));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Get product image from Redux products state
  const getProductImage = (productId) => {
    const product = products.find(p => p.id === productId);
    console.log(`Looking for product ${productId}:`, product ? 'Found' : 'Not found');
    if (product) {
      console.log('Product found:', {
        id: product.id,
        name: product.name,
        image: product.image,
        imageUrl: product.imageUrl
      });
      // Try different image field names
      const imageUrl = product.image || product.imageUrl || product.images?.[0];
      console.log('Image URL:', imageUrl);
      return imageUrl;
    }
    console.log('Available products:', products.map(p => ({ id: p.id, name: p.name, image: p.image })));
    return null;
  };

  // Get product name from Redux products state
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Try different name field names
      return product.name || product.productName || product.title;
    }
    return null;
  };

  // Cancel order API call
  const cancelOrderAPI = async (orderId, reason) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const payload = {
        status: "cancelled",
        adminNotes: reason
      };

      console.log('Cancelling order:', orderId, 'with reason:', reason);
      console.log('API Payload:', payload);

      const response = await apiClient.put(`/api/orders/${orderId}/status`, payload);

      console.log('Cancel order API response:', response.data);

      if (response.data && response.data.success) {
        // Refresh orders after successful cancellation
        await fetchOrders();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  // Reorder API call
  const reorderAPI = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const payload = {
        status: "pending"
      };

      console.log('Reordering order:', orderId);
      console.log('API Payload:', payload);

      const response = await apiClient.put(`/api/orders/${orderId}/status`, payload);

      console.log('Reorder API response:', response.data);

      if (response.data && response.data.success) {
        // Refresh orders after successful reorder
        await fetchOrders();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to reorder');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      throw error;
    }
  };

  // Refresh orders
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Fetch orders when component mounts and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Always fetch products first to ensure images are available
      fetchProducts().then(() => {
        fetchOrders();
      });
    }, [])
  );

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      console.log('Fetching products for orders...');

      const response = await apiClient.get('/api/products/status/active');

      console.log('Products API Response:', response.data);

      if (response.data && response.data.success) {
        const productsData = response.data.data.products;
        if (productsData && Array.isArray(productsData)) {
          console.log('Products fetched successfully:', productsData.length);
          console.log('Sample product:', productsData[0]);
          // Store products in Redux
          dispatch(setProducts(productsData));
        } else {
          console.log('No products data received');
        }
      } else {
        console.log('Products API failed:', response.data?.message);
      }
    } catch (error) {
      console.error('Error fetching products for orders:', error);
    }
  };

  const handleReasonSubmit = async (reason) => {
    setModalVisible(false);

    if (!currentAction) return;

    if (currentAction.type === 'return') {
      dispatch(returnOrder({ orderId: currentAction.orderId, reason }));
      Alert.alert('Order Returned', `Order ${currentAction.orderId} returned for reason: ${reason}`);
    } else if (currentAction.type === 'cancel') {
      try {
        console.log('Submitting cancel order with reason:', reason);
        await cancelOrderAPI(currentAction.orderId, reason);
        Alert.alert('Order Cancelled', 'Order cancelled successfully.');
      } catch (error) {
        console.error('Cancel order error:', error);
        Alert.alert('Error', 'Failed to cancel order. Please try again.');
      }
    }

    setCurrentAction(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return styles.statusPending;
      case 'Accepted':
        return styles.statusAccepted;
      case 'Out for Delivery':
        return styles.statusOutForDelivery;
      case 'Delivered':
        return styles.statusDelivered;
      case 'Cancelled':
        return styles.statusCancelled;
      case 'Returned':
        return styles.statusReturned;
      default:
        return {};
    }
  };

  const handleTrackOrder = (order) => {
    dispatch(setCurrentOrder(order));
    // navigation.navigate('OrderTracking', { orderId: order.id });
    navigation.navigate("Main", { screen: "Tracking", orderId: order.id })

  };

  const handleReorder = (orderId) => {
    setCurrentReorderId(orderId);
    setReorderModalVisible(true);
  };

  const handleReorderConfirm = async () => {
    if (currentReorderId) {
      try {
        console.log('Confirming reorder for order:', currentReorderId);
        await reorderAPI(currentReorderId);
        Alert.alert('Success', 'Your order has been reordered successfully.');
        setReorderModalVisible(false);
        setCurrentReorderId(null);
      } catch (error) {
        console.error('Reorder error:', error);
        Alert.alert('Error', 'Failed to reorder. Please try again.');
      }
    }
  };

  const handleReorderCancel = () => {
    setReorderModalVisible(false);
    setCurrentReorderId(null);
  };

  const handleAction = (type, orderId) => {
    setCurrentAction({ type, orderId });
    setReasonsList(type === 'cancel' ? cancelReasons : returnReasons);
    setModalVisible(true);
  };

  const toggleProductExpansion = (orderId) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };


  const renderOrderItem = ({ item }) => {
    const isExpanded = expandedOrders.has(item.id);
    const showAllProducts = isExpanded || item.items.length <= 1;
    const displayItems = showAllProducts ? item.items : item.items.slice(0, 1);

    return (
      <View style={styles.orderCard}>
        {/* Order Header with Gradient Effect */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderIdContainer}>
              <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
              <Text style={styles.orderId}>#{item.orderNumber}</Text>
            </View>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : item.status}</Text>
          </View>
        </View>

        {/* Order Summary with Icons */}
        <View style={styles.orderSummary}>
          <View style={styles.summaryItem}>
            <Ionicons name="cube-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.summaryLabel}>{item.items.length} Items</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="wallet-outline" size={14} color={COLORS.primary} />
            <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
          </View>
        </View>

        {/* Product Preview with Expandable Feature */}
        <View style={styles.productPreview}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Products</Text>
            {item.items.length > 1 && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => toggleProductExpansion(item.id)}>
                <Text style={styles.expandButtonText}>
                  {isExpanded ? 'Show Less' : `+${item.items.length - 1} More`}
                </Text>
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={12} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.productList}>
            {displayItems.map((orderItem, index) => {
              const productImage = getProductImage(orderItem.productId);
              const productName = getProductName(orderItem.productId) || orderItem.productName;
              return (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productImageContainer}>
                    {productImage ? (
                      <Image 
                        source={{ uri: productImage }} 
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="cube-outline" size={18} color={COLORS.textSecondary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{productName}</Text>
                    <View style={styles.productMeta}>
                      <Text style={styles.productVariant}>{orderItem.variantLabel}</Text>
                      <Text style={styles.productQuantity}>Qty: {orderItem.quantity}</Text>
                    </View>
                    <Text style={styles.productPrice}>₹{orderItem.total}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Buttons with Better Design */}
        <View style={styles.actionButtons}>
          {item.status !== 'cancelled' && item.status !== 'returned' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleTrackOrder(item)}>
              <Ionicons name="location-outline" size={14} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Track Order</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'cancelled' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleReorder(item.id)}>
              <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'delivered' && (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => handleAction('return', item.id)}>
              <Ionicons name="return-up-back-outline" size={14} color={COLORS.error} />
              <Text style={styles.outlineButtonText}>Return</Text>
            </TouchableOpacity>
          )}
          
          {(item.status === 'pending' || item.status === 'confirmed') && (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => handleAction('cancel', item.id)}>
              <Ionicons name="close-circle-outline" size={14} color={COLORS.error} />
              <Text style={styles.outlineButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyOrders = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No orders yet!</Text>
      <Text style={styles.emptySubtitle}>Place your first order to see it here.</Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Main', { screen: "Products" })}>
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{STRINGS.orders}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{STRINGS.orders}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.orders}</Text>
      </View>

      {orders.length === 0 ? (
        renderEmptyOrders()
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      <ReasonModal
        visible={modalVisible}
        title={currentAction?.type === 'return' ? 'Select a reason for returning the order' : 'Select a reason for cancelling the order'}
        reasonsList={reasonsList}
        onClose={() => {
          setModalVisible(false);
          setCurrentAction(null);
        }}
        onSubmit={handleReasonSubmit}
      />

      <Modal
        visible={reorderModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleReorderCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Reorder</Text>
            <Text style={styles.reorderModalText}>
              Are you sure you want to reorder this order?
              This will change the order status to pending.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: COLORS.gray, marginRight: 10 }]}
                onPress={handleReorderCancel}>
                <Text style={styles.submitButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleReorderConfirm}>
                <Text style={styles.submitButtonText}>Reorder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  ordersList: {
    padding: spacing.md,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderInfo: {
    flex: 1,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  orderId: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: spacing.xs,
  },
  orderDate: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs / 2,
    backgroundColor: COLORS.lightGray + '20',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: spacing.xs,
  },
  productPreview: {
    marginBottom: spacing.xs,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  previewTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  expandButtonText: {
    fontSize: fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 2,
  },
  productList: {
    gap: spacing.xs / 2,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray + '20',
    padding: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImageContainer: {
    width: 30,
    height: 30,
    marginRight: spacing.xs,
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
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 1,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  productVariant: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    marginRight: spacing.xs,
  },
  productQuantity: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
  },
  productPrice: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: spacing.xs,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  secondaryButton: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  outlineButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  outlineButtonText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: wp('85%'),
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    elevation: 5,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: COLORS.text,
  },
  reorderModalText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.xxl,
    marginBottom: spacing.lg,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: hp('10%'),
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('2%'),
    borderRadius: borderRadius.md,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp('3.75%'),
    paddingVertical: wp('2%'),
    borderRadius: borderRadius.md,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // New styles for API integration
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});

export default OrdersScreen;

