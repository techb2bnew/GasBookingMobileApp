import React, {useState, useEffect} from 'react';
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
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS, STRINGS} from '../constants';
import {clearCart} from '../redux/slices/cartSlice';
import {addOrder} from '../redux/slices/orderSlice';
import {wp, hp, fontSize, spacing, borderRadius} from '../utils/dimensions';
import {
  reorder,
  setCurrentOrder,
  cancelOrder,
  returnOrder,
  setOrders,
  setLoading,
  setError,
} from '../redux/slices/orderSlice';
import {setProducts} from '../redux/slices/productSlice';
import ReasonModal from '../components/ReasonModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiConfig';

const OrdersScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {orders, isLoading, error} = useSelector(state => state.orders);
  const {products} = useSelector(state => state.products);
  const [modalVisible, setModalVisible] = useState(false);
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [reasonsList, setReasonsList] = useState([]);
  const [currentReorderId, setCurrentReorderId] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);

  // Local states for UI
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);

  const cancelReasons = [
    'Placed order by mistake',
    'Wrong delivery address',
    'Need to change quantity or items',
    'Duplicate order',
    'No longer required',
    'Other',
  ];

  const returnReasons = [
    'Cylinder damaged or defective',
    'Wrong cylinder or size delivered',
    'Delivery was too late',
    'Not satisfied with product',
    'Changed my mind',
    'Other',
  ];

  // Fetch orders from API with pagination
  const fetchOrders = async (page = 1) => {
    try {
      if (page === 1) {
        dispatch(setLoading(true));
      } else {
        setLoadingPage(true);
      }
      dispatch(setError(null));

      console.log(`Fetching orders from API - Page: ${page}...`);
      const response = await apiClient.get('/api/orders', {
        params: {
          page: page,
          limit: 10,
        },
      });

      console.log('Orders API Response:', response.data);

      if (response?.data && response?.data?.success) {
        const ordersData = response?.data?.data?.orders || [];
        const paginationData = response?.data?.data?.pagination || {};

        console.log(`Page ${page}: ${ordersData.length} orders`);
        console.log('Pagination data:', paginationData);

        dispatch(setOrders(ordersData));
        setCurrentPage(paginationData.currentPage || page);
        setTotalPages(paginationData.totalPages || 1);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        dispatch(setError('Session expired. Please login again.'));
      } else {
        dispatch(
          setError(
            error.response?.data?.message ||
              'Failed to fetch orders. Please try again.',
          ),
        );
      }
    } finally {
      dispatch(setLoading(false));
      setLoadingPage(false);
    }
  };

  // Get product image from Redux products state
  const getProductImage = productId => {
    const product = products.find(p => p.id === productId);
    console.log(
      `Looking for product ${productId}:`,
      product ? 'Found' : 'Not found',
    );
    if (product) {
      console.log('Product found:', {
        id: product.id,
        name: product.name,
        image: product.image,
        imageUrl: product.imageUrl,
      });
      // Try different image field names
      const imageUrl = product.image || product.imageUrl || product.images?.[0];
      console.log('Image URL:', imageUrl);
      return imageUrl;
    }
    console.log(
      'Available products:',
      products.map(p => ({id: p.id, name: p.name, image: p.image})),
    );
    return null;
  };

  // Get product name from Redux products state
  const getProductName = productId => {
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
        status: 'cancelled',
        adminNotes: reason,
      };

      console.log('Cancelling order:', orderId, 'with reason:', reason);
      console.log('API Payload:', payload);

      const response = await apiClient.put(
        `/api/orders/${orderId}/status`,
        payload,
      );

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
  const reorderAPI = async orderId => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      const payload = {
        status: 'pending',
      };

      console.log('Reordering order:', orderId);
      console.log('API Payload:', payload);

      const response = await apiClient.put(
        `/api/orders/${orderId}/status`,
        payload,
      );

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

  // Return order API call
  const returnOrderAPI = async (orderId, reason) => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      const payload = {
        reason: reason,
        adminNotes: `Customer returned order: ${reason}`,
      };

      console.log('Returning order:', orderId, 'with reason:', reason);
      console.log('API Payload:', payload);

      const response = await apiClient.put(
        `/api/orders/${orderId}/return`,
        payload,
      );

      console.log('Return order API response:', response.data);

      if (response.data && response.data.success) {
        // Refresh orders after successful return
        await fetchOrders();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to return order');
      }
    } catch (error) {
      console.error('Error returning order:', error);
      throw error;
    }
  };

  // Pagination navigation functions
  const goToNextPage = () => {
    if (currentPage < totalPages && !loadingPage) {
      console.log(`Going to next page: ${currentPage + 1}`);
      fetchOrders(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1 && !loadingPage) {
      console.log(`Going to previous page: ${currentPage - 1}`);
      fetchOrders(currentPage - 1);
    }
  };

  // Refresh orders
  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchOrders(1);
    setRefreshing(false);
  };

  // Fetch orders when component mounts and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Always fetch products first to ensure images are available
      fetchProducts().then(() => {
        setCurrentPage(1);
        fetchOrders(1);
      });
    }, []),
  );

  // 🔥 SOCKET EVENT LISTENERS - Real-time updates
  useEffect(() => {
    // Import socketService
    const socketService = require('../utils/socketService').default;
    const socket = socketService.socket;

    if (socket && socketService.isConnected) {
      console.log('🎧 OrdersScreen: Setting up socket event listeners...');

      const handleOrderCreated = data => {
        console.log('📦 OrdersScreen: New order created', data.data);
        setCurrentPage(1);
        fetchOrders(1); // Refresh orders list from page 1
      };

      const handleOrderStatusUpdated = data => {
        console.log('🔄 OrdersScreen: Order status updated', data.data);
        console.log(
          '🔄 Order ID:',
          data.data.orderId,
          'New Status:',
          data.data.status,
        );
        setCurrentPage(1);
        fetchOrders(1); // Refresh orders list from page 1
      };

      const handleOrderAssigned = data => {
        console.log('👤 OrdersScreen: Order assigned', data.data);
        setCurrentPage(1);
        fetchOrders(1); // Refresh orders list from page 1
      };

      const handleOrderDelivered = data => {
        console.log('✅ OrdersScreen: Order delivered', data.data);
        setCurrentPage(1);
        fetchOrders(1); // Refresh orders list from page 1
      };

      // Register listeners
      socket.on('order:created', handleOrderCreated);
      socket.on('order:status-updated', handleOrderStatusUpdated);
      socket.on('order:assigned', handleOrderAssigned);
      socket.on('order:delivered', handleOrderDelivered);

      console.log('✅ OrdersScreen: Socket listeners registered');

      // Cleanup on unmount
      return () => {
        console.log('🧹 OrdersScreen: Cleaning up socket listeners');
        socket.off('order:created', handleOrderCreated);
        socket.off('order:status-updated', handleOrderStatusUpdated);
        socket.off('order:assigned', handleOrderAssigned);
        socket.off('order:delivered', handleOrderDelivered);
      };
    } else {
      console.log(
        '⚠️ OrdersScreen: Socket not connected, listeners not set up',
      );
    }
  }, []);

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

  const handleReasonSubmit = async reason => {
    setModalVisible(false);

    if (!currentAction) return;

    if (currentAction.type === 'return') {
      try {
        console.log('Submitting return order with reason:', reason);
        await returnOrderAPI(currentAction.orderId, reason);
        Alert.alert('Order Returned', 'Order returned successfully.');
      } catch (error) {
        console.error('Return order error:', error);
        Alert.alert('Error', 'Failed to return order. Please try again.');
      }
    } else if (currentAction.type === 'cancel') {
      try {
        await cancelOrderAPI(currentAction.orderId, reason);
        console.log('Submitting cancel order with reason:', reason);
        // Alert.alert('Order Cancelled', 'Order cancelled successfully.');
      } catch (error) {
        console.error('Cancel order error:', error);
        Alert.alert('Error', 'Failed to cancel order. Please try again.');
      }
    }

    setCurrentAction(null);
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  const handleTrackOrder = order => {
    dispatch(setCurrentOrder(order));
    navigation.navigate('OrderTracking', { orderId: order.id || order.orderId });
  };

  // Handle order card click to view details
  const handleOrderClick = order => {
    navigation.navigate('OrderDetails', {order});
  };

  const handleReorder = orderId => {
    setCurrentReorderId(orderId);
    setReorderModalVisible(true);
  };

  const handleReorderConfirm = async () => {
    if (currentReorderId) {
      try {
        console.log('Confirming reorder for order:', currentReorderId);
        await reorderAPI(currentReorderId);
        setReorderModalVisible(false);
        Alert.alert('Success', 'Your order has been reordered successfully.');
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

  // Handle view agent
  const handleViewAgent = agent => {
    setCurrentAgent(agent);
    setAgentModalVisible(true);
  };

  // Handle call agent
  const handleCallAgent = phoneNumber => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Unable to make phone calls on this device');
        }
      })
      .catch(err => {
        console.error('Error opening phone dialer:', err);
        Alert.alert('Error', 'Unable to make phone calls');
      });
  };

  // Handle close agent modal
  const handleCloseAgentModal = () => {
    setAgentModalVisible(false);
    setCurrentAgent(null);
  };

  const handleAction = (type, orderId) => {
    setCurrentAction({type, orderId});
    setReasonsList(type === 'cancel' ? cancelReasons : returnReasons);
    setModalVisible(true);
  };

  const toggleProductExpansion = orderId => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };

  const renderOrderItem = ({item}) => {
    // Safety check for items array
    if (!item || !item.items || !Array.isArray(item.items)) {
      console.warn('⚠️ Order item missing items array:', item?.id);
      return null;
    }

    const isExpanded = expandedOrders.has(item.id);
    const showAllProducts = isExpanded || item.items.length <= 1;
    const displayItems = showAllProducts ? item.items : item.items.slice(0, 1);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderClick(item)}
        activeOpacity={0.7}>
        {/* Order Header with Gradient Effect */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderIdContainer}>
              <Ionicons
                name="receipt-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={[styles.orderId, {color: COLORS.blue}]}>
                #{item.orderNumber}
              </Text>
            </View>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {item.status === 'assigned' || item.status === 'out_for_delivery'
                ? 'Out for Delivery'
                : item.status
                ? `Order ${
                    item.status.charAt(0).toUpperCase() + item.status.slice(1)
                  }`
                : item.status}
            </Text>
          </View>
        </View>

        {/* Order Summary with Icons */}
        <View style={styles.orderSummary}>
          <View style={styles.summaryItem}>
            <Ionicons
              name="cube-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.summaryLabel}>{item.items.length} Items</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.totalAmount}>KSH{item.totalAmount}</Text>
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
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.productList}>
            {displayItems.map((orderItem, index) => {
              const productImage = getProductImage(orderItem.productId);
              const productName =
                getProductName(orderItem.productId) || orderItem.productName;
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
                          size={18}
                          color={COLORS.textSecondary}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {productName}
                    </Text>
                    <View style={styles.productMeta}>
                      <Text style={styles.productVariant}>
                        {orderItem.variantLabel}
                      </Text>
                      <Text style={styles.productQuantity}>
                        Qty: {orderItem.quantity}
                      </Text>
                    </View>
                    <Text style={styles.productPrice}>KSH{orderItem.total}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Buttons with Better Design */}
        <View style={styles.actionButtons}>
          {item.status === 'assigned' && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleTrackOrder(item)}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={COLORS.white}
                />
                <Text style={styles.primaryButtonText}>Track Order</Text>
              </TouchableOpacity>

              {item.assignedAgent && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => handleViewAgent(item.assignedAgent)}>
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={COLORS.primary}
                  />
                  <Text style={styles.secondaryButtonText}>View Agent</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {item.status === 'cancelled' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleReorder(item.id)}>
              <Ionicons
                name="refresh-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.secondaryButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}

          {item.status === 'delivered' && (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => handleAction('return', item.id)}>
              <Ionicons
                name="return-up-back-outline"
                size={14}
                color={COLORS.error}
              />
              <Text style={styles.outlineButtonText}>Return</Text>
            </TouchableOpacity>
          )}

          {(item.status === 'pending' || item.status === 'confirmed') && (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => handleAction('cancel', item.id)}>
              <Ionicons
                name="close-circle-outline"
                size={14}
                color={COLORS.error}
              />
              <Text style={styles.outlineButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyOrders = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No orders yet!</Text>
      <Text style={styles.emptySubtitle}>
        Place your first order to see it here.
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Main', {screen: 'Products'})}>
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if ( orders?.length === 0) {
    return (
      // <View style={styles.container}>
      //   <View style={styles.header}>
      //     <Text style={styles.title}>{STRINGS.orders}</Text>
      //   </View>
      //   <View style={styles.loadingContainer}>
      //     <Text style={styles.loadingText}>Loading orders...</Text>
      //   </View>
      // </View>
      <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No orders yet!</Text>
      <Text style={styles.emptySubtitle}>
        Place your first order to see it here.
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Products', {screen: 'Products'})}>
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
    );
  }

  // Error state
  if (error && orders?.length === 0) {
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
console.log("ordersssss",orders);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{STRINGS.orders}</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={{paddingHorizontal: 6, paddingBottom:66}}>
        {orders?.length == 0 ? (
          renderEmptyOrders()
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={item =>
              `${item.id}-${item.status}-${item.lastUpdated || ''}`
            }
            extraData={orders}
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
      </View>

      {/* Pagination Controls */}
      {orders.length > 0 && totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationButtonDisabled,
            ]}
            onPress={goToPreviousPage}
            disabled={currentPage === 1 || loadingPage}>
            <Ionicons
              name="chevron-back"
              size={16}
              color={currentPage === 1 ? COLORS.textSecondary : COLORS.primary}
            />
            <Text
              style={[
                styles.paginationButtonText,
                currentPage === 1 && styles.paginationButtonTextDisabled,
              ]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Page {currentPage} of {totalPages}
            </Text>
            {loadingPage && (
              <Text style={styles.paginationLoadingText}>Loading...</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === totalPages && styles.paginationButtonDisabled,
            ]}
            onPress={goToNextPage}
            disabled={currentPage === totalPages || loadingPage}>
            <Text
              style={[
                styles.paginationButtonText,
                currentPage === totalPages &&
                  styles.paginationButtonTextDisabled,
              ]}>
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={
                currentPage === totalPages
                  ? COLORS.textSecondary
                  : COLORS.primary
              }
            />
          </TouchableOpacity>
        </View>
      )}

      <ReasonModal
        visible={modalVisible}
        title={
          currentAction?.type === 'return'
            ? 'Select a reason for returning the order'
            : 'Select a reason for            cancelling the order'
        }
        reasonsList={reasonsList}
        onClose={() => {
          setModalVisible(false);
          setCurrentAction(null);
        }}
        onSubmit={handleReasonSubmit}
      />

      <Modal
        visible={reorderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleReorderCancel}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={handleReorderCancel}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContainer}
            onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Confirm Reorder</Text>
            <Text style={styles.reorderModalText}>
              Are you sure you want to reorder this order?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {backgroundColor: COLORS.gray, marginRight: 10},
                ]}
                onPress={handleReorderCancel}>
                <Text style={styles.submitButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleReorderConfirm}>
                <Text style={styles.submitButtonText}>Reorder</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Agent Details Modal */}
      <Modal
        visible={agentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAgentModal}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={handleCloseAgentModal}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.agentModalContainer}
            onPress={e => e.stopPropagation()}>
            <View style={styles.agentModalHeader}>
              <Text style={styles.agentModalTitle}>Delivery Agent Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseAgentModal}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {currentAgent && (
              <View style={styles.agentDetailsContainer}>
                <View style={styles.agentDetailItem}>
                  <View style={styles.agentDetailIcon}>
                    <Ionicons name="person" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.agentDetailInfo}>
                    <Text style={styles.agentDetailLabel}>Agent Name</Text>
                    <Text style={styles.agentDetailValue}>
                      {currentAgent.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.agentDetailItem}>
                  <View style={styles.agentDetailIcon}>
                    <Ionicons name="call" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.agentDetailInfo}>
                    <Text style={styles.agentDetailLabel}>Phone Number</Text>
                    <TouchableOpacity
                      onPress={() => handleCallAgent(currentAgent.phone)}>
                      <Text style={styles.agentPhoneNumber}>
                        {currentAgent.phone}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.agentDetailItem}>
                  <View style={styles.agentDetailIcon}>
                    <Ionicons name="car" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.agentDetailInfo}>
                    <Text style={styles.agentDetailLabel}>Vehicle Number</Text>
                    <Text style={styles.agentDetailValue}>
                      {currentAgent.vehicleNumber}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.agentModalActions}>
              <TouchableOpacity
                style={styles.callAgentButton}
                onPress={() =>
                  currentAgent && handleCallAgent(currentAgent.phone)
                }>
                <Ionicons name="call" size={16} color={COLORS.white} />
                <Text style={styles.callAgentButtonText}>Call Agent</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
    paddingTop: 60,
  },
  // backButton: {
  //   width: 40,
  // },
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
  ordersList: {
    padding: spacing.sm,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md / 2,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs / 2,
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
    marginBottom: spacing.xs / 2,
    paddingVertical: spacing.xs / 3,
    backgroundColor: COLORS.lightGray + '15',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
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
    marginBottom: spacing.xs / 2,
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
    backgroundColor: COLORS.lightGray + '15',
    padding: spacing.xs / 3,
    borderRadius: borderRadius.sm,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  productImageContainer: {
    width: 24,
    height: 24,
    marginRight: spacing.xs / 2,
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
    paddingVertical: 4,
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
    marginTop: spacing.xs / 2,
    paddingTop: spacing.xs / 2,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    gap: spacing.xs / 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  secondaryButton: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
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
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
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
    shadowOffset: {width: 0, height: 4},
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
  // Agent Modal Styles
  agentModalContainer: {
    width: wp('90%'),
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  agentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  agentModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: COLORS.lightGray + '20',
  },
  agentDetailsContainer: {
    marginBottom: spacing.lg,
  },
  agentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
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
  agentModalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  callAgentButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary,
    minWidth: 100,
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: COLORS.lightGray + '20',
    borderColor: COLORS.border,
  },
  paginationButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginHorizontal: spacing.xs,
  },
  paginationButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  paginationInfo: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.md,
  },
  paginationText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  paginationLoadingText: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export default OrdersScreen;
