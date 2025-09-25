import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiConfig';
import { COLORS, STRINGS } from '../constants';
import {
  setDeliveryType,
  setDeliveryMode,
  setPaymentMethod,
  setSelectedAddress,
  setSelectedAgency,
  clearCart,
} from '../redux/slices/cartSlice';
import { addOrder } from '../redux/slices/orderSlice';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';

const CheckoutScreen = ({ navigation }) => {
  console.log('CheckoutScreen rendering...');
  
  const dispatch = useDispatch();
  
  // Defensive selectors with fallbacks
  const cartState = useSelector(state => state.cart) || {};
  const profileState = useSelector(state => state.profile) || {};
  const authState = useSelector(state => state.auth) || {};
  
  const { 
    items = [], 
    totalAmount = 0, 
    deliveryType = 'Home Delivery', 
    deliveryMode = 'home_delivery', 
    paymentMethod = 'Cash on Delivery', 
    selectedAddress = null, 
    selectedAgency = null 
  } = cartState;
  
  // Debug Redux state
  console.log('Cart State:', cartState);
  console.log('Selected Agency from Redux:', selectedAgency);
  
  const { addresses = [], defaultAddressId = null } = profileState;
  const { user = null } = authState;
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [isProfileUpdateModalVisible, setIsProfileUpdateModalVisible] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
  const [isAgencyDetailsModalVisible, setIsAgencyDetailsModalVisible] = useState(false);
  const [selectedAgencyForDetails, setSelectedAgencyForDetails] = useState(null);
  
  // Profile update form states
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      
      const response = await apiClient.get('/api/auth/profile');

      console.log('Profile API Response:', response.data);

      if (response.data && response.data.success) {
        setUserProfile(response.data.data.user);
        setProfileError(null);
      } else {
        console.log('Failed to fetch profile:', response.data?.message);
        setUserProfile(null);
        setProfileError(response.data?.message || 'Failed to fetch profile');
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      setProfileError(error.message || 'Failed to fetch profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchSelectedAgency = async () => {
    try {
      setIsLoadingAgencies(true);
      
      // Get selected agency ID from AsyncStorage
      const selectedAgencyId = await AsyncStorage.getItem('selectedAgencyId');
      
      if (!selectedAgencyId) {
        console.log('No selected agency ID found');
        setAgencies([]);
        return;
      }

      // Fetch all agencies and filter for the selected one
      const response = await apiClient.get('/api/agencies/active');

      console.log('Agencies API Response:', response.data);

      if (response.data && response.data.success) {
        const allAgencies = response.data.data.agencies;
        const selectedAgency = allAgencies.find(agency => agency.id === selectedAgencyId);
        
        if (selectedAgency) {
          setAgencies([selectedAgency]); // Only set the selected agency
          // Auto-select the agency since there's only one
          dispatch(setSelectedAgency(selectedAgency));
          console.log('Selected agency found:', selectedAgency);
          console.log('Selected agency ID:', selectedAgency.id);
        } else {
          console.log('Selected agency not found in active agencies');
          setAgencies([]);
          dispatch(setSelectedAgency(null));
        }
      } else {
        console.log('Failed to fetch agencies:', response.data?.message);
        setAgencies([]);
      }

    } catch (error) {
      console.error('Error fetching selected agency:', error);
      setAgencies([]);
    } finally {
      setIsLoadingAgencies(false);
    }
  };

  const updateProfile = async () => {
    try {
      setIsUpdatingProfile(true);
      
      // Validate required fields
      if (!profileFormData.name.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }

      const updateData = {
        name: profileFormData.name.trim(),
        email: profileFormData.email.trim() || undefined,
        phone: profileFormData.phone.trim() || undefined,
      };

      console.log('Updating profile with data:', updateData);

      const response = await apiClient.put('/api/auth/profile', updateData);

      console.log('Profile update response:', response.data);

      if (response.data && response.data.success) {
        // Update local user profile state
        setUserProfile(response.data.data.user);
        setIsProfileUpdateModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
        
        // Clear form data
        setProfileFormData({
          name: '',
          email: '',
          phone: '',
        });
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to update profile');
      }

    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useEffect(() => {
    // Agar selectedAddress deleted ho chuka hai
    const validSelectedAddress = addresses.find(addr => addr.id === selectedAddress?.id);

    if (!validSelectedAddress) {
      // Naya default address set karo ya null
      const defaultAddress = addresses.find(addr => addr.id === defaultAddressId) || null;
      dispatch(setSelectedAddress(defaultAddress));
    }

    // Fetch user profile data
    fetchUserProfile();
    
    // Fetch selected agency for both delivery modes (needed for agencyId in API)
    fetchSelectedAgency();
  }, [addresses, defaultAddressId, selectedAddress, dispatch, deliveryMode]);

  // Populate form data when user profile is loaded
  useEffect(() => {
    if (userProfile) {
      setProfileFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile]);

  const deliveryModeOptions = [
    { id: 'home_delivery', label: 'Home Delivery' },
    { id: 'pickup', label: 'Pickup from Agency' },
  ];

  const deliveryOptions = [
    { id: 'Home Delivery', label: STRINGS.homeDelivery, price: 0 },
  ];

  const paymentOptions = [
    { id: 'Cash on Delivery', label: STRINGS.cashOnDelivery },
  ];

  const handlePlaceOrder = async () => {
    // Check delivery mode specific validations
    if (deliveryMode === 'home_delivery') {
      if (!selectedAddress) {
        Alert.alert('Error', 'Please add and select a delivery address first');
        return;
      }

      // Check if address has all required fields
      if (!selectedAddress.address || !selectedAddress.city || !selectedAddress.pincode) {
        Alert.alert('Error', 'Please complete your address details');
        return;
      }
    } else if (deliveryMode === 'pickup') {
      if (!selectedAgency) {
        Alert.alert('Error', 'Please select an agency for pickup');
        return;
      }
    }

    // Check if user is authenticated
    if (!userProfile) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    // Check if cart has items
    if (!items || items.length === 0) {
      Alert.alert('Error', 'Your cart is empty. Please add items before placing an order.');
      return;
    }

    setLoading(true);

    try {
      // Log user data and cart items for debugging
      console.log('User Profile Data:', userProfile);
      console.log('Cart Items:', items);
      console.log('Selected Address:', selectedAddress);
      console.log('Selected Agency:', selectedAgency);
      console.log('Delivery Mode:', deliveryMode);

      // Format items according to API specification
      const formattedItems = items.map(item => ({
        productId: item.id,
        productName: item.productName || item.name,
        variantLabel: item.weight || 'default',
        variantPrice: item.price,
        quantity: item.quantity,
        total: item.quantity * item.price
      }));

      // Prepare API payload with actual user data
      const orderData = {
        customerName: userProfile?.name,
        customerEmail: userProfile?.email,
        customerPhone: userProfile?.phone,
        deliveryMode: deliveryMode,
        items: formattedItems,
        paymentMethod: deliveryMode === 'pickup' ? 'Cash on Pickup' : (paymentMethod === 'Cash on Delivery' ? 'cash_on_delivery' : 'cash_on_delivery')
      };

      // Add address or agency based on delivery mode
      if (deliveryMode === 'home_delivery') {
        const fullAddress = `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.pincode}`;
        orderData.customerAddress = fullAddress;
      }
      // Add agencyId for both delivery modes (from selected agency on home page)
      if (selectedAgency && selectedAgency.agencyId) {
        orderData.agencyId = selectedAgency.agencyId;
      } 

      console.log('Order API Payload:', orderData);

      // Make API call
      const response = await apiClient.post('/api/orders/checkout', orderData);

      console.log('Order API Response:', response.data);

      if (response?.data && response?.data?.success) {
        // Order created successfully
        const order = {
          id: response?.data.data?.orderId || Date.now().toString(),
          items: items,
          totalAmount: totalAmount,
          deliveryMode: deliveryMode,
          deliveryType: deliveryMode === 'pickup' ? 'Pickup from Agency' : 'Home Delivery',
          paymentMethod: deliveryMode === 'pickup' ? 'Cash on Pickup' : 'Cash on Delivery',
          address: deliveryMode === 'home_delivery' ? selectedAddress : null,
          agency: selectedAgency || (deliveryMode === 'home_delivery' ? selectedAgency : null),
          status: 'Pending',
          orderDate: new Date().toISOString(),
          estimatedDelivery: deliveryMode === 'pickup' 
            ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours for pickup
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours for delivery
        };

        dispatch(addOrder(order));
        dispatch(clearCart());
        setLoading(false);

        // Alert.alert('Success', 'Order placed successfully!', [
        //   {
        //     text: 'OK',
        //     onPress: () => 
        navigation.navigate('OrderConfirmation', { orderId: order.id })
        //   }
        // ]);
      } else {
        throw new Error(response.data?.message || 'Failed to create order');
      }

    } catch (error) {
      console.error('Order creation error:', error);
      setLoading(false);
      
      if (error.response) {
        // Check if it's a customerName validation error
        const apiErrorMessage = error.response.data?.error || error.response.data?.message || '';
        if (apiErrorMessage.includes('customerName') && apiErrorMessage.includes('must be a string')) {
          // Show profile update modal
          setIsProfileUpdateModalVisible(true);
        } else {
          // Show API error in modal
          setErrorMessage(apiErrorMessage || 'Failed to create order. Please try again.');
          setIsErrorModalVisible(true);
        }
      } else if (error.request) {
        // Network error
        setErrorMessage('Network error. Please check your connection and try again.');
        setIsErrorModalVisible(true);
      } else {
        // Other error
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
        setIsErrorModalVisible(true);
      }
    }
  };

  const renderDeliveryModeOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionCard,
        deliveryMode === option.id && styles.optionCardSelected,
      ]}
      onPress={() => dispatch(setDeliveryMode(option.id))}>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionLabel,
          deliveryMode === option.id && styles.optionLabelSelected,
        ]}>
          {option.label}
        </Text>
      </View>
      <View style={[
        styles.radioButton,
        deliveryMode === option.id && styles.radioButtonSelected,
      ]} />
    </TouchableOpacity>
  );

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

  const renderAgencyOption = (agency) => (
    <View
      key={agency.id}
      style={[
        styles.agencyCard,
        styles.agencyCardSelected, // Always show as selected since it's the only one
      ]}>
      <View style={styles.agencyContent}>
        <Text style={styles.agencyTitle}>{agency.name}</Text>
        <Text style={styles.agencyText}>{agency.address}</Text>
        <Text style={styles.agencyText}>{agency.city}, {agency.pincode}</Text>
        <Text style={styles.agencyPhone}>Phone: {agency.phone}</Text>
      </View>
      <View style={styles.agencyActions}>
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => {
            setSelectedAgencyForDetails(agency);
            setIsAgencyDetailsModalVisible(true);
          }}>
          <Text style={styles.viewDetailsButtonText}>View Details</Text>
        </TouchableOpacity>
        <View style={[
          styles.radioButton,
          styles.radioButtonSelected, // Always show as selected
        ]} />
      </View>
    </View>
  );

  // Simple fallback to ensure component renders
  if (!items) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{STRINGS.checkout}</Text>
        </View>
        <View style={styles.content}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{STRINGS.checkout}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.userDetailsContainer}>
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Name:</Text>
              <Text style={styles.userDetailValue}>
                {userProfile?.name || 'Not provided'}
              </Text>
            </View>
            {userProfile?.phone && (
              <View style={styles.userDetailRow}>
                <Text style={styles.userDetailLabel}>Phone:</Text>
                <Text style={styles.userDetailValue}>{userProfile.phone}</Text>
              </View>
            )}
            {userProfile?.email && (
              <View style={styles.userDetailRow}>
                <Text style={styles.userDetailLabel}>Email:</Text>
                <Text style={styles.userDetailValue}>{userProfile.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.productName}</Text>
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

        {/* Delivery Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your Delivery Mode</Text>
          {deliveryModeOptions.map(renderDeliveryModeOption)}
        </View>

        {/* Delivery Type - Only show for home delivery */}
        {deliveryMode === 'home_delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{STRINGS.deliveryType}</Text>
            {deliveryOptions.map(renderDeliveryOption)}
          </View>
        )}

        {/* Delivery Address - Only show for home delivery */}
        {deliveryMode === 'home_delivery' && deliveryType === 'Home Delivery' && (
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

        {/* Agency Selection - Only show for pickup */}
        {deliveryMode === 'pickup' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Agency for Pickup</Text>
            
            {isLoadingAgencies ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading agency...</Text>
              </View>
            ) : agencies.length === 0 ? (
              <View style={styles.noAgencyContainer}>
                <Text style={styles.noAgencyText}>No agency selected. Please select an agency from the home page.</Text>
              </View>
            ) : (
              agencies.map(renderAgencyOption)
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
          style={[styles.placeOrderButton, (loading || isLoadingProfile || !userProfile) && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading || isLoadingProfile || !userProfile}>
          <Text style={styles.placeOrderButtonText}>
            {loading ? 'Placing Order...' : isLoadingProfile ? 'Loading Profile...' : !userProfile ? 'Profile Required' : STRINGS.placeOrder}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Update Modal */}
      <Modal
        visible={isProfileUpdateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProfileUpdateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.profileUpdateModalContainer}>
            <View style={styles.profileUpdateModal}>
              <Text style={styles.profileUpdateTitle}>Update Profile</Text>
              <Text style={styles.profileUpdateMessage}>
                Please complete your profile information to place an order.
              </Text>

              <View style={styles.profileForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileFormData.name}
                    onChangeText={(text) => setProfileFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileFormData.email}
                    onChangeText={(text) => setProfileFormData(prev => ({ ...prev, email: text }))}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileFormData.phone}
                    onChangeText={(text) => setProfileFormData(prev => ({ ...prev, phone: text }))}
                    placeholder="Enter your phone number"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.profileUpdateActions}>
                <TouchableOpacity
                  style={[styles.profileUpdateButton, styles.cancelButton]}
                  onPress={() => setIsProfileUpdateModalVisible(false)}
                  disabled={isUpdatingProfile}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.profileUpdateButton, 
                    styles.updateProfileButton,
                    isUpdatingProfile && styles.updateProfileButtonDisabled
                  ]}
                  onPress={updateProfile}
                  disabled={isUpdatingProfile}>
                  <Text style={styles.updateProfileButtonText}>
                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Agency Details Modal */}
      <Modal
        visible={isAgencyDetailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAgencyDetailsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.agencyDetailsModal}>
            <Text style={styles.agencyDetailsTitle}>Agency Details</Text>
            
            {selectedAgencyForDetails && (
              <View style={styles.agencyDetailsContent}>
                <View style={styles.agencyDetailRow}>
                  <Text style={styles.agencyDetailLabel}>Name:</Text>
                  <Text style={styles.agencyDetailValue}>{selectedAgencyForDetails.name}</Text>
                </View>
                
                <View style={styles.agencyDetailRow}>
                  <Text style={styles.agencyDetailLabel}>Email:</Text>
                  <Text style={styles.agencyDetailValue}>{selectedAgencyForDetails.email}</Text>
                </View>
                
                <View style={styles.agencyDetailRow}>
                  <Text style={styles.agencyDetailLabel}>Phone:</Text>
                  <Text style={styles.agencyDetailValue}>{selectedAgencyForDetails.phone}</Text>
                </View>
                
                <View style={styles.agencyDetailRow}>
                  <Text style={styles.agencyDetailLabel}>Address:</Text>
                  <Text style={styles.agencyDetailValue}>{selectedAgencyForDetails.address}</Text>
                </View>
                
                <View style={styles.agencyDetailRow}>
                  <Text style={styles.agencyDetailLabel}>City:</Text>
                  <Text style={styles.agencyDetailValue}>{selectedAgencyForDetails.city}</Text>
                </View>
                
                <View style={styles.agencyDetailRow}>
                  <Text style={styles.agencyDetailLabel}>Pincode:</Text>
                  <Text style={styles.agencyDetailValue}>{selectedAgencyForDetails.pincode}</Text>
                </View>
                
                {selectedAgencyForDetails.landmark && (
                  <View style={styles.agencyDetailRow}>
                    <Text style={styles.agencyDetailLabel}>Landmark:</Text>
                    <Text style={styles.agencyDetailValue}>{selectedAgencyForDetails.landmark}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.closeAgencyDetailsButton}
              onPress={() => setIsAgencyDetailsModalVisible(false)}>
              <Text style={styles.closeAgencyDetailsButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={isErrorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsErrorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={50} color={COLORS.error} />
            </View>
            <Text style={styles.errorModalTitle}>Order Failed</Text>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
            
            <TouchableOpacity
              style={styles.errorModalButton}
              onPress={() => {
                setIsErrorModalVisible(false);
                navigation.navigate('Cart');
              }}>
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
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
    // justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    paddingVertical: wp('1.25%'),
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginLeft:10
  },
  placeholder: {
    width: wp('15%'),
  },
  profileLoadingText: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
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
    marginBottom: spacing.md,
  },
  sectionTitle: {
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
  orderItemName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  orderItemDetails: {
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
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.md,
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
  // Profile Update Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileUpdateModalContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileUpdateModal: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  profileUpdateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  profileUpdateMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  profileUpdateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  profileUpdateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  updateProfileButton: {
    backgroundColor: COLORS.primary,
  },
  updateProfileButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  updateProfileButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  // Profile Form Styles
  profileForm: {
    width: '100%',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  // User Details Styles
  userDetailsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  userDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  userDetailValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  // Agency Styles
  agencyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 10,
  },
  agencyCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  agencyContent: {
    flex: 1,
    marginRight: 10,
  },
  agencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  agencyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  agencyPhone: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 5,
  },
  agencyActions: {
    alignItems: 'center',
  },
  viewDetailsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  viewDetailsButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  noAgencyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAgencyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  // Agency Details Modal Styles
  agencyDetailsModal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  agencyDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  agencyDetailsContent: {
    width: '100%',
    marginBottom: 20,
  },
  agencyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  agencyDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  agencyDetailValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  closeAgencyDetailsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeAgencyDetailsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Error Modal Styles
  errorModal: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  errorIconContainer: {
    marginBottom: 15,
  },
  errorModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorModalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorModalButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  errorModalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;

