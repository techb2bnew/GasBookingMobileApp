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
  Image,
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
  removeFromCart,
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
  const [showAllItems, setShowAllItems] = useState(false);
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
      ]}>
        {deliveryMode === option.id && <View style={styles.radioButtonInner} />}
      </View>
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
      ]}>
        {deliveryType === option.id && <View style={styles.radioButtonInner} />}
      </View>
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
          <View style={styles.userDetailsCard}>
            <View style={styles.userDetailsHeader}>
              <View style={styles.userDetailsIconContainer}>
                {userProfile?.profileImage ? (
                  <Image
                    source={{ uri: userProfile.profileImage }}
                    style={styles.userDetailsProfileImage}
                    resizeMode="cover"
                    defaultSource={{ uri: 'https://via.placeholder.com/24x24' }}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
                )}
              </View>
              <Text style={styles.userDetailsTitle}>Account Information</Text>
            </View>
            
            <View style={styles.userDetailsContent}>
              <View style={styles.userDetailRow}>
                <View style={styles.userInfoContainer}>
                  <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userDetailLabel}>Name</Text>
                    <Text style={styles.userDetailValue}>
                      {userProfile?.name || 'Not provided'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {userProfile?.phone && (
                <View style={styles.userDetailRow}>
                  <View style={styles.userInfoContainer}>
                    <Ionicons name="call-outline" size={16} color={COLORS.primary} />
                    <View style={styles.userInfo}>
                      <Text style={styles.userDetailLabel}>Phone</Text>
                      <Text style={styles.userDetailValue}>{userProfile.phone}</Text>
                    </View>
                  </View>
                </View>
              )}
              
              {userProfile?.email && (
                <View style={[styles.userDetailRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
                  <View style={styles.userInfoContainer}>
                    <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
                    <View style={styles.userInfo}>
                      <Text style={styles.userDetailLabel}>Email</Text>
                      <Text style={styles.userDetailValue}>{userProfile.email}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {(showAllItems ? items : items.slice(0, 2)).map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemContent}>
                <View style={styles.orderItemImageContainer}>
                  <Image 
                    source={{
                      uri: item.images?.[0] || item.image || item.productImage || 'https://via.placeholder.com/60x60'
                    }} 
                    style={styles.orderItemImage}
                  />
                </View>
                <View style={styles.orderItemDetailsContainer}>
                  <Text style={styles.orderItemName}>{item.productName}</Text>
                  <Text style={styles.orderItemDetails}>
                    Qty: {item.quantity} × ₹{item.price} = ₹{item.quantity * item.price}
                  </Text>
                  {item.weight && (
                    <Text style={styles.orderItemWeight}>{item.weight}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => {
                    console.log('Removing item:', item);
                    dispatch(removeFromCart({ 
                      productId: item.id,
                      weight: item.weight,
                      category: item.category,
                      type: item.type
                    }));
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {items.length > 2 && !showAllItems && (
            <TouchableOpacity 
              style={styles.viewAllButton} 
              onPress={() => setShowAllItems(true)}>
              <Text style={styles.viewAllButtonText}>
                View All {items.length} Products
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {items.length > 2 && showAllItems && (
            <TouchableOpacity 
              style={styles.viewAllButton} 
              onPress={() => setShowAllItems(false)}>
              <Text style={styles.viewAllButtonText}>
                Show Less
              </Text>
              <Ionicons name="chevron-up" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Delivery Mode */}
        <View style={styles.deliveryModeSection}>
          <Text style={styles.deliveryModeTitle}>Delivery Mode</Text>
          <View style={styles.deliveryModeContainer}>
            {deliveryModeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.deliveryModeOption,
                  deliveryMode === option.id && styles.deliveryModeOptionSelected,
                ]}
                onPress={() => dispatch(setDeliveryMode(option.id))}>
                <View style={[
                  styles.compactRadioButton,
                  deliveryMode === option.id && styles.compactRadioButtonSelected,
                ]}>
                  {deliveryMode === option.id && <View style={styles.compactRadioButtonInner} />}
                </View>
                <Text style={[
                  styles.deliveryModeLabel,
                  deliveryMode === option.id && styles.deliveryModeLabelSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delivery Address - Only show for home delivery */}
        {deliveryMode === 'home_delivery' && deliveryType === 'Home Delivery' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddAddress')}>
                <Text style={styles.manageAddressText}>Manage Addresses</Text>
              </TouchableOpacity>
            </View>

            {!selectedAddress || addresses.length === 0 ? (
              <View style={styles.noAddressContainer}>
                <Text style={styles.noAddressText}>
                  {addresses.length === 0 ? 'No addresses found' : 'No address selected'}
                </Text>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => navigation.navigate('AddAddress')}>
                  <Text style={styles.addAddressButtonText}>
                    {addresses.length === 0 ? 'Add Address' : 'Select Address'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.selectedAddressCard}>
                <View style={styles.selectedAddressContent}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressTitle}>{selectedAddress.title}</Text>
                    <View style={styles.defaultIndicator}>
                      <Ionicons name="star" size={14} color={COLORS.primary} />
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  </View>
                  <Text style={styles.addressText}>{selectedAddress.address}</Text>
                  <Text style={styles.addressText}>{selectedAddress.city}, {selectedAddress.pincode}</Text>
                  {selectedAddress.landmark && (
                    <Text style={styles.addressText}>Landmark: {selectedAddress.landmark}</Text>
                  )}
                </View>
              </View>
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

        {/* Payment Method - Only show for home delivery */}
        {deliveryMode === 'home_delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{STRINGS.paymentMethod}</Text>
            {paymentOptions.map(renderPaymentOption)}
          </View>
        )}
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: spacing.sm,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: -0.3,
    flex: 1,
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
    paddingBottom: hp('6%'),
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    marginTop: spacing.xs,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 0,
    letterSpacing: -0.1,
  },
  orderItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.lightGray + '15',
    marginBottom: 2,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
  },
  orderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemImageContainer: {
    marginRight: spacing.sm,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    resizeMode: 'cover',
  },
  orderItemDetailsContainer: {
    flex: 1,
  },
  orderItemName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  orderItemDetails: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  orderItemWeight: {
    fontSize: fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  deleteButton: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginLeft: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff444420',
    borderWidth: 1,
    borderColor: '#ff444450',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  viewAllButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: spacing.xs,
  },
  deliveryModeSection: {
    backgroundColor: COLORS.cardBackground,
    marginTop: spacing.xs,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryModeTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  deliveryModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    flex: 1,
    marginHorizontal: 1,
  },
  deliveryModeOptionSelected: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  deliveryModeLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: spacing.xs,
  },
  deliveryModeLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  compactRadioButton: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRadioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  compactRadioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    elevation: 4,
  },
  radioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
  },
  addressContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addressTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
    lineHeight: fontSize.md,
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
  selectedAddressCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedAddressContent: {
    padding: spacing.md,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  defaultIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultText: {
    fontSize: fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 2,
  },
  footer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center"
  },
  footerTotal: {
    alignItems: 'center',
  },
  footerTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  placeOrderButtonDisabled: {
    backgroundColor: COLORS.gray,
    borderColor: COLORS.gray,
    shadowOpacity: 0.2,
  },
  placeOrderButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
    letterSpacing: 0.2,
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
  userDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  userDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    padding: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  userDetailsIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
    overflow: 'hidden',
  },
  userDetailsProfileImage: {
    width: 24,
    height: 24,
    borderRadius: 18,
  },
  userDetailsTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  userDetailsContent: {
    backgroundColor: '#ffffff',
    paddingBottom: 0,
  },
  userDetailsContainer: {
    backgroundColor: COLORS.subtle,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
    backgroundColor: '#ffffff',
    marginBottom: 0,
    paddingHorizontal: spacing.sm,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: spacing.xs,
    flex: 1,
  },
  userDetailLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 1,
    letterSpacing: 0,
  },
  userDetailValue: {
    fontSize: fontSize.sm,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  // Agency Styles
  agencyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  agencyCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  agencyContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  agencyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: spacing.xs,
  },
  agencyText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
    lineHeight: fontSize.md,
  },
  agencyPhone: {
    fontSize: fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  agencyActions: {
    alignItems: 'center',
  },
  viewDetailsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  viewDetailsButtonText: {
    color: COLORS.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: COLORS.subtle,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  noAgencyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: COLORS.subtle,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  noAgencyText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: fontSize.lg,
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

