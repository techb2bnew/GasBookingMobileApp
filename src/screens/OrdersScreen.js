import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS, STRINGS } from '../constants';
import { reorder, setCurrentOrder, cancelOrder, returnOrder } from '../redux/slices/orderSlice';
import ReasonModal from '../components/ReasonModal';

const OrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { orders } = useSelector(state => state.orders);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [reasonsList, setReasonsList] = useState([]);

  const cancelReasons = [
    'Change of mind',
    'Ordered by mistake',
    'Found cheaper option',
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

  const handleReasonSubmit = (reason) => {
    setModalVisible(false);

    if (!currentAction) return;

    if (currentAction.type === 'return') {
      dispatch(returnOrder({ orderId: currentAction.orderId, reason }));
      Alert.alert('Order Returned', `Order ${currentAction.orderId} returned for reason: ${reason}`);
    } else if (currentAction.type === 'cancel') {
      dispatch(cancelOrder({ orderId: currentAction.orderId, reason }));
      Alert.alert('Order Cancelled', `Order ${currentAction.orderId} cancelled for reason: ${reason}`);
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
    Alert.alert(
      'Reorder',
      'Are you sure you want to reorder this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reorder',
          onPress: () => {
            dispatch(reorder(orderId));
            Alert.alert('Success', 'Your past order has been re-added as a new pending order.');
          },
        },
      ]
    );
  };

  const handleAction = (type, orderId) => {
    setCurrentAction({ type, orderId });
    setReasonsList(type === 'cancel' ? cancelReasons : returnReasons);
    setModalVisible(true);
  };


  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order ID: #{item.id}</Text>
        <Text style={[styles.orderStatus, getStatusStyle(item.status)]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.orderDate}>Date: {formatDate(item.orderDate)}</Text>
      <Text style={styles.orderTotal}>Total: ₹{item.totalAmount}</Text>
      <Text style={styles.orderItemsCount}>Items: {item.items.length}</Text>

      <View style={styles.orderActions}>
        <View style={styles.buttonRow}>
          {item.status !== 'Cancelled' && item.status !== 'Returned' && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => handleTrackOrder(item)}>
              <Text style={styles.trackButtonText}>{STRINGS.trackOrder}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => handleReorder(item.id)}>
            <Text style={styles.reorderButtonText}>{STRINGS.reorder}</Text>
          </TouchableOpacity>
          {item.status === 'Delivered' ? (
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => handleAction('return', item.id)}>
              <Text style={styles.returnButtonText}>Return</Text>
            </TouchableOpacity>
          ) : item.status === 'Pending' || item.status === 'Accepted' ? (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleAction('cancel', item.id)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

    </View>
  );

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
        />
      )}

      <ReasonModal
        visible={modalVisible}
        title={currentAction?.type === 'return' ? 'Select a reason for returning the order' : 'Select a reason for cancelling the order'}
        reasonsList={reasonsList}
        onClose={() => setModalVisible(false)}
        onSubmit={handleReasonSubmit}
      />
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
    fontSize: 23,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  ordersList: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
    color: COLORS.white,
  },
  statusAccepted: {
    backgroundColor: COLORS.info,
    color: COLORS.white,
  },
  statusOutForDelivery: {
    backgroundColor: COLORS.secondary,
    color: COLORS.white,
  },
  statusDelivered: {
    backgroundColor: COLORS.success,
    color: COLORS.white,
  },
  statusCancelled: {
    backgroundColor: COLORS.error,
    color: COLORS.white,
  },
  statusReturned: {
    backgroundColor: COLORS.warning,
    color: COLORS.white,
  },
  orderDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  orderItemsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  orderActions: {
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  trackButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  reorderButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  reorderButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
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
    borderRadius: 8,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  returnButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default OrdersScreen;

