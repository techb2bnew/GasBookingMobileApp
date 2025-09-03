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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from 'react-native-vector-icons/dist/Ionicons';
import { COLORS, STRINGS } from '../constants';
import { clearCart } from '../redux/slices/cartSlice';
import { addOrder } from '../redux/slices/orderSlice';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';
import { reorder, setCurrentOrder, cancelOrder, returnOrder } from '../redux/slices/orderSlice';
import ReasonModal from '../components/ReasonModal';

const OrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { orders } = useSelector(state => state.orders);
  const [modalVisible, setModalVisible] = useState(false);
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [reasonsList, setReasonsList] = useState([]);
  const [currentReorderId, setCurrentReorderId] = useState(null);

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
    setCurrentReorderId(orderId);
    setReorderModalVisible(true);
  };

  const handleReorderConfirm = () => {
    if (currentReorderId) {
      dispatch(reorder(currentReorderId));
      Alert.alert('Success', 'Your past order has been re-added as a new pending order.');
      setReorderModalVisible(false);
      setCurrentReorderId(null);
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
              Are you sure you want to reorder the item from your past order?
              This will add it as a new pending order.
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
    padding: spacing.lg,
  },
  orderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderId: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderStatus: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
    paddingVertical: wp('1.25%'),
    borderRadius: wp('1.25%'),
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
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: spacing.sm,
  },
  orderActions: {
    marginTop: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: wp('2%'),
    gap: wp('2%'),
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('2%'),
    borderRadius: borderRadius.md,
    flex: 1,
    alignItems: 'center',
  },
  trackButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  reorderButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('2%'),
    borderRadius: borderRadius.md,
    flex: 1,
    alignItems: 'center',
  },
  reorderButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp('7.5%'),
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('2%'),
    borderRadius: borderRadius.md,
    flex: 1,
    alignItems: 'center',
  },
  returnButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
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
});

export default OrdersScreen;

