import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, STRINGS } from '../constants';
import {
  setDeliveryType,
  setPaymentMethod,
  setSelectedAddress,
  clearCart,
} from '../redux/slices/cartSlice';
import { addOrder } from '../redux/slices/orderSlice';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, totalAmount, deliveryType, paymentMethod, selectedAddress } = useSelector(state => state.cart);
  const { addresses, defaultAddressId } = useSelector(state => state.profile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Agar selectedAddress deleted ho chuka hai
    const validSelectedAddress = addresses.find(addr => addr.id === selectedAddress?.id);

    if (!validSelectedAddress) {
      // Naya default address set karo ya null
      const defaultAddress = addresses.find(addr => addr.id === defaultAddressId) || null;
      dispatch(setSelectedAddress(defaultAddress));
    }
  }, [addresses, defaultAddressId, selectedAddress, dispatch]);

  const deliveryOptions = [
    { id: 'Home Delivery', label: STRINGS.homeDelivery, price: 0 },
    { id: 'Pickup', label: STRINGS.pickup, price: 0 },
  ];

  const paymentOptions = [
    { id: 'Cash on Delivery', label: STRINGS.cashOnDelivery },
  ];

  const handlePlaceOrder = () => {
    if (deliveryType === 'Home Delivery' && !selectedAddress) {
      Alert.alert('Error', 'Please add and select a delivery address first');
      return;
    }

    if (deliveryType === 'Home Delivery' && selectedAddress) {
      // Check if address has all required fields
      if (!selectedAddress.address || !selectedAddress.city || !selectedAddress.pincode) {
        Alert.alert('Error', 'Please complete your address details');
        return;
      }
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const order = {
        id: Date.now().toString(),
        items: items,
        totalAmount: totalAmount,
        deliveryType: deliveryType,
        paymentMethod: paymentMethod,
        address: deliveryType === 'Home Delivery' ? selectedAddress : null,
        status: 'Pending',
        orderDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };

      dispatch(addOrder(order));
      dispatch(clearCart());
      setLoading(false);

      navigation.navigate('OrderConfirmation', { orderId: order.id });
    }, 2000);
  };

  const renderDeliveryOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionCard,
        deliveryType === option.id && styles.optionCardSelected,
      ]}
      onPress={() => dispatch(setDeliveryType(option.id))}>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionLabel,
          deliveryType === option.id && styles.optionLabelSelected,
        ]}>
          {option.label}
        </Text>
        {option.price > 0 && (
          <Text style={styles.optionPrice}>₹{option.price}</Text>
        )}
      </View>
      <View style={[
        styles.radioButton,
        deliveryType === option.id && styles.radioButtonSelected,
      ]} />
    </TouchableOpacity>
  );

  const renderPaymentOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionCard,
        paymentMethod === option.id && styles.optionCardSelected,
      ]}
      onPress={() => dispatch(setPaymentMethod(option.id))}>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionLabel,
          paymentMethod === option.id && styles.optionLabelSelected,
        ]}>
          {option.label}
        </Text>
      </View>
      <View style={[
        styles.radioButton,
        paymentMethod === option.id && styles.radioButtonSelected,
      ]} />
    </TouchableOpacity>
  );

  const renderAddressOption = (address) => (
    <TouchableOpacity
      key={address.id}
      style={[
        styles.addressCard,
        selectedAddress?.id === address.id && styles.addressCardSelected,
      ]}
      onPress={() => dispatch(setSelectedAddress(address))}>
      <View style={styles.addressContent}>
        <Text style={styles.addressTitle}>{address.title}</Text>
        <Text style={styles.addressText}>{address.address}</Text>
        <Text style={styles.addressText}>{address.city}, {address.pincode}</Text>
      </View>
      <View style={[
        styles.radioButton,
        selectedAddress?.id === address.id && styles.radioButtonSelected,
      ]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{STRINGS.checkout}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.name}</Text>
              <Text style={styles.orderItemDetails}>
                Qty: {item.quantity} × ₹{item.price} = ₹{item.quantity * item.price}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Delivery Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{STRINGS.deliveryType}</Text>
          {deliveryOptions.map(renderDeliveryOption)}
        </View>

        {/* Delivery Address */}
        {deliveryType === 'Home Delivery' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Main', {
                  screen: 'Profile',
                })}>
                <Text style={styles.manageAddressText}>Manage Addresses</Text>
              </TouchableOpacity>
            </View>

            {addresses.length === 0 ? (
              <View style={styles.noAddressContainer}>
                <Text style={styles.noAddressText}>No addresses found</Text>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => navigation.navigate('AddAddress')}>
                  <Text style={styles.addAddressButtonText}>Add Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              addresses.map(renderAddressOption)
            )}
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{STRINGS.paymentMethod}</Text>
          {paymentOptions.map(renderPaymentOption)}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total: ₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}>
          <Text style={styles.placeOrderButtonText}>
            {loading ? 'Placing Order...' : STRINGS.placeOrder}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    paddingVertical: 5,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    marginTop: 15,
    marginHorizontal: 15,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
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
  orderItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  orderItemDetails: {
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
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionPrice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 10,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  addressContent: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  manageAddressText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  noAddressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAddressText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  addAddressButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addAddressButtonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center"
  },
  footerTotal: {
    alignItems: 'center',
  },
  footerTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  placeOrderButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  placeOrderButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CheckoutScreen;

