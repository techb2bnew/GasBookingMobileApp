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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { usePricingEvents } from '../hooks/useSocketEvents';

const CheckoutScreen = ({ navigation }) => {
  console.log('CheckoutScreen rendering...');
  
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  // Defensive selectors with fallbacks
  const cartState = useSelector(state => state.cart) || {};
  const profileState = useSelector(state => state.profile) || {};
  const authState = useSelector(state => state.auth) || {};
  
  const { 
    items = [], 
    totalAmount = 0,
    totalItems = 0,
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
  
  // Tax calculation states
  const [taxData, setTaxData] = useState(null);
  const [isLoadingTax, setIsLoadingTax] = useState(false);
  const [finalTotalAmount, setFinalTotalAmount] = useState(() => parseFloat(totalAmount) || 0);
  
  // Delivery charges states
  const [deliveryChargeData, setDeliveryChargeData] = useState(null);
  const [isLoadingDeliveryCharge, setIsLoadingDeliveryCharge] = useState(false);
  const [deliveryChargeError, setDeliveryChargeError] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  
  // Coupon states
  const [coupons, setCoupons] = useState([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  
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

  const fetchTaxCalculation = async () => {
    try {
      setIsLoadingTax(true);
      
      console.log('Calculating tax for amount:', totalAmount);
      
      const response = await apiClient.post('/api/tax/calculate', {
        amount: totalAmount
      });

      console.log('Tax Calculation API Response:', response.data);

      if (response.data && response.data.success) {
        const taxInfo = response.data.data;
        setTaxData(taxInfo);
        
        // Safe calculation with proper number conversion
        const amountAfterTax = parseFloat(taxInfo.totalAmount) || 0;
        const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
        const safeCouponDiscount = parseFloat(couponDiscount) || 0;
        const finalAmount = amountAfterTax + safeDeliveryCharge - safeCouponDiscount;
        
        // Ensure finalAmount is not NaN
        setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        
        console.log('Tax calculated:', taxInfo);
        console.log('Final amount breakdown:', {
          amountAfterTax,
          safeDeliveryCharge,
          safeCouponDiscount,
          finalAmount
        });
      } else {
        console.log('Failed to calculate tax:', response.data?.message);
        setTaxData(null);
        
        // Safe fallback calculation
        const safeTotal = parseFloat(totalAmount) || 0;
        const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
        const safeCouponDiscount = parseFloat(couponDiscount) || 0;
        const finalAmount = safeTotal + safeDeliveryCharge - safeCouponDiscount;
        
        setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
      }

    } catch (error) {
      console.error('Error calculating tax:', error);
      setTaxData(null);
      
      // Safe error fallback calculation
      const safeTotal = parseFloat(totalAmount) || 0;
      const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
      const safeCouponDiscount = parseFloat(couponDiscount) || 0;
      const finalAmount = safeTotal + safeDeliveryCharge - safeCouponDiscount;
      
      setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
    } finally {
      setIsLoadingTax(false);
    }
  };

  const fetchDeliveryCharges = async () => {
    // Only fetch delivery charges for home delivery mode
    if (deliveryMode !== 'home_delivery') {
      setDeliveryChargeData(null);
      setDeliveryChargeError(null);
      setDeliveryCharge(0);
      return;
    }

    try {
      // Check if we have all required data
      const customerId = userProfile?.id;
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      const addressId = selectedAddress?.id;

      if (!customerId || !agencyId || !addressId) {
        console.log('Missing IDs for delivery charges');
        setDeliveryChargeData(null);
        setDeliveryChargeError(null);
        setDeliveryCharge(0);
        return;
      }

      setIsLoadingDeliveryCharge(true);
      setDeliveryChargeError(null);
      
      const payload = {
        customerId,
        agencyId,
        addressId
      };

      console.log('Fetching delivery charges for:', addressId);

      const response = await apiClient.post('/api/delivery-charges/calculate', payload);

      if (response.data && response.data.success) {
        const chargeData = response.data.data;
        
        // Check if delivery charge is not configured
        if (chargeData.chargeType === 'not_configured') {
          console.log('Delivery charge not configured:', chargeData.message);
          setDeliveryChargeData(null);
          setDeliveryChargeError(null); // No error, just not configured
          setDeliveryCharge(0);
          return;
        }
        
        setDeliveryChargeData(chargeData);
        setDeliveryChargeError(null);
        
        // Safe number conversion and rounding
        const chargeValue = parseFloat(chargeData.deliveryCharge) || 0;
        const roundedCharge = Math.floor(chargeValue); // Round down
        
        // Ensure it's a valid number
        setDeliveryCharge(isNaN(roundedCharge) ? 0 : Math.max(0, roundedCharge));
        
        console.log('Delivery charge:', roundedCharge, chargeData.chargeType, chargeData.distance?.distanceText);
      } else {
        setDeliveryChargeData(null);
        setDeliveryChargeError(null);
        setDeliveryCharge(0);
      }

    } catch (error) {
      console.error('Error calculating delivery charges:', error);
      
      // Check if it's an error response (out of radius or not configured)
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.success === false && errorData.error) {
          const errorMessage = errorData.error;
          
          // Check if delivery charges are not configured (404 or specific message)
          if (errorMessage.includes('not found') || errorMessage.includes('not configured')) {
            console.log('Delivery charges not configured for this agency');
            setDeliveryChargeError(null); // Don't show as error, just no charge
            setDeliveryChargeData(null);
            setDeliveryCharge(0);
          } else {
            // Other errors like out of radius
            setDeliveryChargeError(errorMessage);
            setDeliveryChargeData(null);
            setDeliveryCharge(0);
            console.log('Delivery not available:', errorMessage);
          }
        } else {
          setDeliveryChargeData(null);
          setDeliveryChargeError(null);
          setDeliveryCharge(0);
        }
      } else {
        setDeliveryChargeData(null);
        setDeliveryChargeError(null);
        setDeliveryCharge(0);
      }
    } finally {
      setIsLoadingDeliveryCharge(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setIsLoadingCoupons(true);
      
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      
      if (!agencyId) {
        console.log('No agency ID available for fetching coupons');
        setCoupons([]);
        return;
      }
      
      console.log('Fetching coupons for agency:', agencyId);
      
      const response = await apiClient.get(`/api/coupons/customer?agencyId=${agencyId}`);

      console.log('Coupons API Response:', response.data);

      if (response.data && response.data.success) {
        setCoupons(response.data.data.coupons || []);
      } else {
        console.log('Failed to fetch coupons:', response.data?.message);
        setCoupons([]);
      }

    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  const applyCoupon = async (couponCode) => {
    try {
      setIsApplyingCoupon(true);
      
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      
      if (!agencyId) {
        Alert.alert('Error', 'Agency information not available');
        setIsApplyingCoupon(false);
        return;
      }
      
      // IMPORTANT: Use base amount (before tax) for coupon calculation
      const baseAmount = parseFloat(taxData?.baseAmount || totalAmount) || 0;
      
      const payload = {
        code: couponCode,
        amount: baseAmount, // Use base amount, not total with tax
        agencyId: agencyId
      };
      
      console.log('=== APPLY COUPON REQUEST ===');
      console.log('Coupon Code:', couponCode);
      console.log('Base Amount (for coupon):', baseAmount);
      console.log('Agency ID:', agencyId);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await apiClient.post('/api/coupons/apply', payload);

      console.log('=== APPLY COUPON RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
        const couponData = response.data.data;
        
        // Safe number conversion
        const safeDiscountAmount = parseFloat(couponData.discountAmount) || 0;
        
        console.log('Discount Amount from Backend:', safeDiscountAmount);
        console.log('Coupon Data from Backend:', couponData);
        
        // Store proper coupon info for future comparisons
        const appliedCouponInfo = {
          id: couponCode, // Use code as ID for matching (since backend doesn't return coupon ID)
          code: couponData.couponCode || couponCode,
          couponCode: couponData.couponCode || couponCode,
          discountType: couponData.discountType,
          discountValue: couponData.discountValue,
          discountAmount: safeDiscountAmount,
          originalAmount: couponData.originalAmount
        };
        
        console.log('Storing applied coupon:', appliedCouponInfo);
        
        setAppliedCoupon(appliedCouponInfo);
        setCouponDiscount(safeDiscountAmount);
        
        // Recalculate final amount with discount and delivery charge - safely
        const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
        
        if (taxData) {
          const taxTotal = parseFloat(taxData.totalAmount) || 0;
          const finalAmount = taxTotal + safeDeliveryCharge - safeDiscountAmount;
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
          
          console.log('Final calculation:', {
            taxTotal,
            deliveryCharge: safeDeliveryCharge,
            discount: safeDiscountAmount,
            finalAmount
          });
        } else {
          const safeTotal = parseFloat(totalAmount) || 0;
          const finalAmount = safeTotal + safeDeliveryCharge - safeDiscountAmount;
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        }
        
        setIsCouponModalVisible(false);
        Alert.alert('Success', `Coupon applied! You saved $${Math.round(safeDiscountAmount)}`);
      } else {
        // Handle API error response
        const errorMsg = response.data?.error || response.data?.message || 'Failed to apply coupon';
        Alert.alert('Coupon Error', errorMsg);
      }

    } catch (error) {
      console.error('Error applying coupon:', error);
      
      // Handle different error cases
      if (error.response?.data) {
        const errorMsg = error.response.data.error || error.response.data.message || 'Failed to apply coupon';
        Alert.alert('Coupon Error', errorMsg);
      } else if (error.request) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to apply coupon. Please try again.');
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    
    // Recalculate final amount without discount but with delivery charge - safely
    const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
    
    if (taxData) {
      const taxTotal = parseFloat(taxData.totalAmount) || 0;
      const finalAmount = taxTotal + safeDeliveryCharge;
      setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
    } else {
      const safeTotal = parseFloat(totalAmount) || 0;
      const finalAmount = safeTotal + safeDeliveryCharge;
      setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
    }
  };

  const handleCouponPress = () => {
    fetchCoupons();
    setIsCouponModalVisible(true);
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

  // Socket events for real-time pricing updates
  usePricingEvents({
    onTaxUpdated: async (taxConfigData) => {
      console.log('💰 Tax config updated in real-time:', taxConfigData);
      
      // If coupon is applied, suggest removing it since base amount changed
      if (appliedCoupon && couponDiscount > 0) {
        Alert.alert(
          'Tax Updated',
          'Tax configuration has changed. Your applied coupon will be recalculated automatically.',
          [{ text: 'OK' }]
        );
      }
      
      // Tax config update hone pe fresh calculation fetch karo
      try {
        setIsLoadingTax(true);
        
        const safeTotal = parseFloat(totalAmount) || 0;
        console.log('Re-calculating tax for amount:', safeTotal);
        
        const response = await apiClient.post('/api/tax/calculate', {
          amount: safeTotal
        });

        if (response.data && response.data.success) {
          const taxInfo = response.data.data;
          setTaxData(taxInfo);
          
          console.log('Tax API Response:', taxInfo);
          console.log('Base Amount:', taxInfo.baseAmount);
          console.log('Tax Amount:', taxInfo.taxAmount);
          console.log('Tax Type:', taxInfo.taxType);
          console.log('Tax Value:', taxInfo.taxValue);
          console.log('Platform Charge:', taxInfo.platformCharge);
          console.log('Total Amount (with tax):', taxInfo.totalAmount);
          
          // If coupon was applied, re-calculate with NEW base amount
          let newCouponDiscount = 0;
          if (appliedCoupon && couponDiscount > 0) {
            const baseAmount = parseFloat(taxInfo.baseAmount) || 0;
            
            if (appliedCoupon.discountType === 'percentage') {
              newCouponDiscount = (baseAmount * parseFloat(appliedCoupon.discountValue || 0)) / 100;
            } else {
              newCouponDiscount = parseFloat(appliedCoupon.discountValue || 0);
            }
            
            newCouponDiscount = isNaN(newCouponDiscount) ? 0 : Math.max(0, newCouponDiscount);
            setCouponDiscount(newCouponDiscount);
            
            console.log('Coupon recalculated with new tax:', {
              oldDiscount: couponDiscount,
              newDiscount: newCouponDiscount
            });
          }
          
          // Safe calculation with updated tax
          const amountAfterTax = parseFloat(taxInfo.totalAmount) || 0;
          const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
          const safeCouponDiscount = newCouponDiscount || parseFloat(couponDiscount) || 0;
          const finalAmount = amountAfterTax + safeDeliveryCharge - safeCouponDiscount;
          
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
          
          console.log('Final calculation after tax update:', {
            baseAmount: taxInfo.baseAmount,
            taxAmount: taxInfo.taxAmount,
            platformCharge: taxInfo.platformCharge,
            totalWithTax: amountAfterTax,
            deliveryCharge: safeDeliveryCharge,
            couponDiscount: safeCouponDiscount,
            finalAmount
          });
          
          Alert.alert(
            'Tax Updated',
            `Tax: $${Math.round(parseFloat(taxInfo.taxAmount) || 0)} | Total: $${Math.round(finalAmount)}`,
            [{ text: 'OK' }]
          );
        } else {
          // Fallback if tax API fails
          const finalAmount = safeTotal + parseFloat(deliveryCharge || 0) - parseFloat(couponDiscount || 0);
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        }
      } catch (error) {
        console.error('Error recalculating tax after socket update:', error);
        // Fallback calculation
        const safeTotal = parseFloat(totalAmount) || 0;
        const finalAmount = safeTotal + parseFloat(deliveryCharge || 0) - parseFloat(couponDiscount || 0);
        setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
      } finally {
        setIsLoadingTax(false);
      }
    },
    onTaxDeleted: () => {
      console.log('💰 Tax deleted');
      
      // Recalculate without tax - safely
      const safeTotal = parseFloat(totalAmount) || 0;
      const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
      const safeCouponDiscount = parseFloat(couponDiscount) || 0;
      const finalAmount = safeTotal + safeDeliveryCharge - safeCouponDiscount;
      
      setTaxData(null);
      setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
      
      console.log('Tax removed calculation:', {
        baseAmount: safeTotal,
        deliveryCharge: safeDeliveryCharge,
        couponDiscount: safeCouponDiscount,
        finalAmount
      });
      
      Alert.alert(
        'Tax Removed',
        `Tax removed. New total: $${Math.round(finalAmount)}`,
        [{ text: 'OK' }]
      );
    },
    onPlatformChargeUpdated: async (chargeData) => {
      console.log('🏦 Platform charge updated:', chargeData);
      
      // Platform charge update hone pe fresh calculation fetch karo
      try {
        setIsLoadingTax(true);
        
        const safeTotal = parseFloat(totalAmount) || 0;
        console.log('Re-calculating with platform charge for amount:', safeTotal);
        
        const response = await apiClient.post('/api/tax/calculate', {
          amount: safeTotal
        });

        if (response.data && response.data.success) {
          const taxInfo = response.data.data;
          setTaxData(taxInfo);
          
          // Safe calculation
          const amountAfterTax = parseFloat(taxInfo.totalAmount) || 0;
          const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
          const safeCouponDiscount = parseFloat(couponDiscount) || 0;
          const finalAmount = amountAfterTax + safeDeliveryCharge - safeCouponDiscount;
          
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
          
          Alert.alert(
            'Platform Charge Updated',
            `Platform charge is now $${chargeData.amount}. New total: $${Math.round(finalAmount)}`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error recalculating after platform charge update:', error);
        Alert.alert(
          'Platform Charge Updated',
          'Platform charge updated. Please refresh to see new total.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoadingTax(false);
      }
    },
    onPlatformChargeDeleted: async () => {
      console.log('🏦 Platform charge deleted');
      
      // Platform charge delete hone pe fresh calculation fetch karo
      try {
        setIsLoadingTax(true);
        
        const safeTotal = parseFloat(totalAmount) || 0;
        const response = await apiClient.post('/api/tax/calculate', {
          amount: safeTotal
        });

        if (response.data && response.data.success) {
          const taxInfo = response.data.data;
          setTaxData(taxInfo);
          
          const amountAfterTax = parseFloat(taxInfo.totalAmount) || 0;
          const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
          const safeCouponDiscount = parseFloat(couponDiscount) || 0;
          const finalAmount = amountAfterTax + safeDeliveryCharge - safeCouponDiscount;
          
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
          
          Alert.alert(
            'Platform Charge Removed',
            `Platform charge removed. New total: $${Math.round(finalAmount)}`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error recalculating after platform charge deletion:', error);
      } finally {
        setIsLoadingTax(false);
      }
    },
    onDeliveryChargeCreated: async (deliveryData) => {
      console.log('🚚 Delivery charge created:', deliveryData);
      // If this is for current agency, fetch delivery charges
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      if (deliveryData.agencyId === agencyId && deliveryMode === 'home_delivery') {
        console.log('🔄 Fetching delivery charges after creation...');
        
        try {
          const customerId = userProfile?.id;
          const addressId = selectedAddress?.id;

          if (customerId && agencyId && addressId) {
            setIsLoadingDeliveryCharge(true);
            setDeliveryChargeError(null);
            
            const payload = {
              customerId,
              agencyId,
              addressId
            };

            const response = await apiClient.post('/api/delivery-charges/calculate', payload);

            if (response.data && response.data.success) {
              const chargeData = response.data.data;
              
              // Check if delivery charge is not configured
              if (chargeData.chargeType === 'not_configured') {
                setDeliveryChargeData(null);
                setDeliveryChargeError(null);
                setDeliveryCharge(0);
                return;
              }
              
              setDeliveryChargeData(chargeData);
              setDeliveryChargeError(null);
              
              const chargeValue = parseFloat(chargeData.deliveryCharge) || 0;
              const roundedCharge = Math.floor(chargeValue);
              setDeliveryCharge(isNaN(roundedCharge) ? 0 : Math.max(0, roundedCharge));
              
              Alert.alert(
                'Delivery Charges Now Available',
                `Delivery charge: $${roundedCharge}`,
                [{ text: 'OK' }]
              );
            }
          }
        } catch (error) {
          console.error('Error fetching delivery charges:', error);
          // Don't show error if charges are just not configured
          setDeliveryChargeData(null);
          setDeliveryChargeError(null);
          setDeliveryCharge(0);
        } finally {
          setIsLoadingDeliveryCharge(false);
        }
      }
    },
    onDeliveryChargeUpdated: async (deliveryData) => {
      console.log('🚚 Delivery charge updated:', deliveryData);
      // If this is for current agency, trigger recalculation
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      if (deliveryData.agencyId === agencyId && deliveryMode === 'home_delivery') {
        // Force re-fetch delivery charges immediately
        console.log('🔄 Re-fetching delivery charges after socket update...');
        
        try {
          const customerId = userProfile?.id;
          const addressId = selectedAddress?.id;

          if (customerId && agencyId && addressId) {
            setIsLoadingDeliveryCharge(true);
            setDeliveryChargeError(null);
            
            const payload = {
              customerId,
              agencyId,
              addressId
            };

            const response = await apiClient.post('/api/delivery-charges/calculate', payload);

            if (response.data && response.data.success) {
              const chargeData = response.data.data;
              
              // Check if delivery charge is not configured
              if (chargeData.chargeType === 'not_configured') {
                setDeliveryChargeData(null);
                setDeliveryChargeError(null);
                setDeliveryCharge(0);
                
                Alert.alert(
                  'No Delivery Charge',
                  'Delivery charges not configured. Free delivery!',
                  [{ text: 'OK' }]
                );
                return;
              }
              
              setDeliveryChargeData(chargeData);
              setDeliveryChargeError(null);
              
              // Safe number conversion
              const chargeValue = parseFloat(chargeData.deliveryCharge) || 0;
              const roundedCharge = Math.floor(chargeValue);
              setDeliveryCharge(isNaN(roundedCharge) ? 0 : Math.max(0, roundedCharge));
              
              console.log('✅ Delivery charge updated via socket:', roundedCharge);
              
              Alert.alert(
                'Delivery Charge Updated',
                `New delivery charge: $${roundedCharge}`,
                [{ text: 'OK' }]
              );
            }
          }
        } catch (error) {
          console.error('Error re-fetching delivery charges:', error);
          // Don't show error, just set to 0
          setDeliveryChargeData(null);
          setDeliveryChargeError(null);
          setDeliveryCharge(0);
        } finally {
          setIsLoadingDeliveryCharge(false);
        }
      }
    },
    onDeliveryChargeDeleted: (deliveryData) => {
      console.log('🚚 Delivery charge deleted:', deliveryData);
      // If this is for current agency, reset delivery charge
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      if (deliveryData.agencyId === agencyId && deliveryMode === 'home_delivery') {
        setDeliveryChargeData(null);
        setDeliveryChargeError(null); // No error, just no charges configured
        setDeliveryCharge(0);
        
        // Recalculate total without delivery charge
        if (taxData) {
          const taxTotal = parseFloat(taxData.totalAmount) || 0;
          const safeCouponDiscount = parseFloat(couponDiscount) || 0;
          const finalAmount = taxTotal - safeCouponDiscount;
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        } else {
          const safeTotal = parseFloat(totalAmount) || 0;
          const safeCouponDiscount = parseFloat(couponDiscount) || 0;
          const finalAmount = safeTotal - safeCouponDiscount;
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        }
        
        Alert.alert(
          'Delivery Charge Removed',
          'Delivery charges have been removed. No delivery fee will be charged.',
          [{ text: 'OK' }]
        );
      }
    },
    onCouponCreated: (couponData) => {
      console.log('🎟️ New coupon available:', couponData);
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      // Only process if it's for current agency
      if (couponData.agencyId === agencyId) {
        // Add to coupons list immediately (real-time update)
        setCoupons(prev => [couponData, ...prev]);
        
        const discount = couponData.discountType === 'percentage' 
          ? `${couponData.discountValue}%` 
          : `$${couponData.discountValue}`;
        
        Alert.alert(
          '🎉 New Coupon Available!',
          `Use code ${couponData.code} to save ${discount}`,
          [{ text: 'Great!' }]
        );
      }
    },
    onCouponUpdated: async (couponData) => {
      console.log('🎟️ Coupon updated:', couponData);
      
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      
      // Update in coupons list (real-time update)
      if (couponData.agencyId === agencyId) {
        setCoupons(prev => prev.map(c => c.id === couponData.id ? couponData : c));
      }
      
      // If this coupon is applied, re-apply it to get correct discount
      // Match by code since backend doesn't return coupon ID
      const isApplied = appliedCoupon && (
        appliedCoupon.code === couponData.code || 
        appliedCoupon.couponCode === couponData.code ||
        appliedCoupon.id === couponData.code
      );
      
      if (isApplied) {
        console.log('🔄 Re-applying updated coupon via backend API...');
        console.log('Applied coupon:', appliedCoupon);
        console.log('Updated coupon:', couponData);
        
        try {
          // Use BASE amount (before tax) for coupon calculation
          const baseAmount = parseFloat(taxData?.baseAmount || totalAmount) || 0;
          
          console.log('Re-applying with base amount:', baseAmount);
          
          const payload = {
            code: couponData.code,
            amount: baseAmount,
            agencyId: agencyId
          };
          
          const response = await apiClient.post('/api/coupons/apply', payload);

          if (response.data && response.data.success) {
            const recalculatedCoupon = response.data.data;
            const safeDiscountAmount = parseFloat(recalculatedCoupon.discountAmount) || 0;
            
            console.log('Recalculated discount from backend:', safeDiscountAmount);
            
            setAppliedCoupon({
              id: couponData.code,
              code: couponData.code,
              couponCode: couponData.code,
              discountType: recalculatedCoupon.discountType,
              discountValue: recalculatedCoupon.discountValue,
              discountAmount: safeDiscountAmount,
              originalAmount: recalculatedCoupon.originalAmount
            });
            setCouponDiscount(safeDiscountAmount);
            
            // Recalculate final total with new discount
            const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
            
            if (taxData) {
              const taxTotal = parseFloat(taxData.totalAmount) || 0;
              const finalAmount = taxTotal + safeDeliveryCharge - safeDiscountAmount;
              setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
            } else {
              const safeTotal = parseFloat(totalAmount) || 0;
              const finalAmount = safeTotal + safeDeliveryCharge - safeDiscountAmount;
              setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
            }
            
            console.log('Coupon re-applied after update:', {
              oldDiscount: parseFloat(appliedCoupon?.discountAmount || 0),
              newDiscount: safeDiscountAmount,
              finalAmount: finalTotalAmount
            });
            
            Alert.alert(
              'Coupon Updated',
              `Coupon ${couponData.code} updated. New discount: $${Math.round(safeDiscountAmount)}`,
              [{ text: 'OK' }]
            );
          } else {
            // Coupon no longer valid, remove it
            setAppliedCoupon(null);
            setCouponDiscount(0);
            
            // Recalculate without discount
            if (taxData) {
              const taxTotal = parseFloat(taxData.totalAmount) || 0;
              const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
              const finalAmount = taxTotal + safeDeliveryCharge;
              setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
            }
            
            Alert.alert(
              'Coupon No Longer Valid',
              `Coupon ${couponData.code} cannot be applied anymore.`,
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.error('Error re-applying updated coupon:', error);
          // Remove coupon if re-application fails
          setAppliedCoupon(null);
          setCouponDiscount(0);
          
          // Recalculate without discount
          if (taxData) {
            const taxTotal = parseFloat(taxData.totalAmount) || 0;
            const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
            const finalAmount = taxTotal + safeDeliveryCharge;
            setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
          }
        }
      }
    },
    onCouponStatusChanged: (couponData) => {
      console.log('🎟️ Coupon status changed:', couponData);
      
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      
      // Update in coupons list (real-time update - show/hide based on isActive)
      if (couponData.agencyId === agencyId) {
        if (couponData.isActive) {
          // Coupon activated - add/update in list
          setCoupons(prev => {
            const exists = prev.find(c => c.id === couponData.id);
            if (exists) {
              return prev.map(c => c.id === couponData.id ? couponData : c);
            } else {
              return [couponData, ...prev];
            }
          });
        } else {
          // Coupon deactivated - remove from list
          setCoupons(prev => prev.filter(c => c.id !== couponData.id));
        }
      }
      
      // Check if this coupon is applied (match by code)
      const isApplied = appliedCoupon && (
        appliedCoupon.code === couponData.code || 
        appliedCoupon.couponCode === couponData.code ||
        appliedCoupon.id === couponData.code
      );
      
      // If applied coupon is deactivated, remove it and recalculate total
      if (isApplied && !couponData.isActive) {
        console.log('⚠️ Applied coupon deactivated, removing...');
        
        setAppliedCoupon(null);
        setCouponDiscount(0);
        
        // Recalculate total without coupon discount
        if (taxData) {
          const taxTotal = parseFloat(taxData.totalAmount) || 0;
          const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
          const finalAmount = taxTotal + safeDeliveryCharge;
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        } else {
          const safeTotal = parseFloat(totalAmount) || 0;
          const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
          const finalAmount = safeTotal + safeDeliveryCharge;
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        }
        
        console.log('Discount removed, new total:', finalTotalAmount);
        
        Alert.alert(
          'Coupon Deactivated',
          `The coupon ${couponData.code} has been removed from your order and discount has been reversed.`,
          [{ text: 'OK' }]
        );
      } else if (couponData.isActive && couponData.agencyId === agencyId && !isApplied) {
        // Show success message for activation (only for current agency, if not already applied)
        Alert.alert(
          'Coupon Activated',
          `Coupon ${couponData.code} is now available!`,
          [{ text: 'OK' }]
        );
      }
    },
    onCouponDeleted: (couponData) => {
      console.log('🎟️ Coupon deleted:', couponData);
      
      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      
      // Remove from coupons list (real-time update)
      if (couponData.agencyId === agencyId) {
        setCoupons(prev => prev.filter(c => c.id !== couponData.id));
      }
      
      // Check if this coupon is applied (match by code)
      const isApplied = appliedCoupon && (
        appliedCoupon.code === couponData.code || 
        appliedCoupon.couponCode === couponData.code ||
        appliedCoupon.id === couponData.code
      );
      
      // If applied coupon is deleted, remove it and recalculate total
      if (isApplied) {
        console.log('⚠️ Applied coupon deleted, removing...');
        
        const oldDiscount = parseFloat(couponDiscount) || 0;
        
        setAppliedCoupon(null);
        setCouponDiscount(0);
        
        // Recalculate total without coupon discount
        if (taxData) {
          const taxTotal = parseFloat(taxData.totalAmount) || 0;
          const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
          const finalAmount = taxTotal + safeDeliveryCharge;
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        } else {
          const safeTotal = parseFloat(totalAmount) || 0;
          const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
          const finalAmount = safeTotal + safeDeliveryCharge;
          setFinalTotalAmount(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
        }
        
        console.log('Discount removed, old:', oldDiscount, 'new total:', finalTotalAmount);
        
        Alert.alert(
          'Coupon Removed',
          `The coupon ${couponData.code} has been removed and $${Math.round(oldDiscount)} discount has been reversed.`,
          [{ text: 'OK' }]
        );
      }
    },
  });

  // Separate useEffect for tax calculation to avoid loops
  useEffect(() => {
    // Fetch tax calculation when cart total changes
    if (totalAmount > 0) {
      fetchTaxCalculation();
    }
  }, [totalAmount]); // Only trigger when totalAmount changes

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

  // Separate useEffect for delivery charges - calls when address changes or required data becomes available
  useEffect(() => {
    const fetchCharges = async () => {
      if (deliveryMode !== 'home_delivery') {
        setDeliveryChargeData(null);
        setDeliveryChargeError(null);
        setDeliveryCharge(0);
        return;
      }

      const agencyId = selectedAgency?.agencyId || selectedAgency?.id;
      
      if (!userProfile?.id || !agencyId || !selectedAddress?.id) {
        return;
      }

      await fetchDeliveryCharges();
    };

    fetchCharges();
  }, [deliveryMode, userProfile?.id, selectedAgency?.agencyId, selectedAgency?.id, selectedAddress?.id]);

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
        quantity: item.quantity
      }));

      // Prepare API payload with actual user data
      const orderData = {
        customerName: userProfile?.name,
        customerEmail: userProfile?.email,
        customerPhone: userProfile?.phone,
        deliveryMode: deliveryMode,
        items: formattedItems,
        paymentMethod: deliveryMode === 'pickup' ? 'Cash on Pickup' : (paymentMethod === 'Cash on Delivery' ? 'cash_on_delivery' : 'cash_on_delivery'),
        ...(appliedCoupon && { couponCode: appliedCoupon.couponCode })
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
          <Text style={styles.optionPrice}>${option.price}</Text>
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
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
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
          <TouchableOpacity 
            style={styles.userDetailsCard}
            onPress={() => {
              setProfileFormData({
                name: userProfile?.name || '',
                email: userProfile?.email || '',
                phone: userProfile?.phone || '',
              });
              setIsProfileUpdateModalVisible(true);
            }}
            activeOpacity={0.7}>
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
              <Ionicons name="create-outline" size={20} color={COLORS.primary} style={styles.editIcon} />
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
            
            <View style={styles.tapToEditHint}>
              <Ionicons name="hand-left-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.tapToEditText}>Tap to edit your information</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
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
                    Qty: {item.quantity} × ${item.price} = ${item.quantity * item.price}
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
        </View>

        {/* Apply Coupon Section */}
        <View style={styles.section}>
          <View style={styles.couponSection}>
            <View style={styles.couponIconContainer}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
              <Text style={styles.couponSectionTitle}>Apply Coupon</Text>
            </View>
            
            {appliedCoupon ? (
              <View style={styles.appliedCouponContainer}>
                <View style={styles.appliedCouponInfo}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <View style={styles.appliedCouponText}>
                    <Text style={styles.appliedCouponCode}>{appliedCoupon.couponCode}</Text>
                    <Text style={styles.appliedCouponSavings}>
                      You saved ${appliedCoupon.discountAmount}!
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeCouponButton}
                  onPress={removeCoupon}>
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.viewCouponsButton}
                onPress={handleCouponPress}>
                <Text style={styles.viewCouponsButtonText}>View Coupons</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Order Summary with Tax Breakdown */}
        <View style={styles.section}>
          <View style={styles.summaryHeader}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            <Text style={styles.summaryHeaderTitle}>Order Summary</Text>
          </View>
          
          {isLoadingTax || isLoadingDeliveryCharge ? (
            <View style={styles.summaryLoadingContainer}>
              <Text style={styles.summaryLoadingText}>
                {isLoadingDeliveryCharge ? 'Calculating delivery charges...' : 'Calculating charges...'}
              </Text>
            </View>
          ) : (totalAmount > 0) ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
                <Text style={styles.summaryValue}>
                  ${Math.round(parseFloat(taxData?.baseAmount || totalAmount) || 0)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                {deliveryMode === 'home_delivery' &&
                <Text style={styles.summaryLabel}>
                  
                  Delivery Fee
                  {deliveryChargeData?.distance?.distanceText && (
                    <Text style={styles.distanceText}> ({deliveryChargeData.distance.distanceText})</Text>
                  )}
                </Text>
}
                {deliveryMode === 'home_delivery' ? (
                  deliveryCharge > 0 ? (
                    <Text style={styles.summaryValue}>
                      ${Math.round(parseFloat(deliveryCharge) || 0)}
                    </Text>
                  ) : (
                    <Text style={styles.freeDelivery}>Free</Text>
                  )
                ) : (
                  null
                )}
              </View>
              
              {deliveryChargeError && (
                <View style={styles.deliveryErrorContainer}>
                  <Ionicons name="warning" size={16} color={COLORS.error} />
                  <Text style={styles.deliveryErrorText}>{deliveryChargeError}</Text>
                </View>
              )}
              
              {/* Tax Charge - Show even if 0 */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Tax Charge
                </Text>
                <Text style={styles.summaryValue}>
                  ${Math.round(parseFloat(taxData?.taxAmount) || 0)}
                </Text>
              </View>
              
              {/* Platform Charge - Show only if taxData exists */}
              {taxData && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Platform Charge</Text>
                  <Text style={styles.summaryValue}>
                    ${Math.round(parseFloat(taxData.platformCharge) || 0)}
                  </Text>
                </View>
              )}
              
              {appliedCoupon && couponDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.discountLabel]}>
                    Coupon Discount ({appliedCoupon.couponCode})
                  </Text>
                  <Text style={styles.discountValue}>
                    -${Math.round(parseFloat(couponDiscount) || 0)}
                  </Text>
                </View>
              )}
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryTotalRow}>
                <View>
                  <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                  <Text style={styles.summaryTotalSubtext}>
                    {appliedCoupon && couponDiscount > 0 
                      ? `After discount of $${Math.round(parseFloat(couponDiscount) || 0)}` 
                      : `Including ${deliveryMode === 'home_delivery' && deliveryCharge > 0 ? 'delivery, ' : ''}tax${(taxData?.platformCharge && parseFloat(taxData.platformCharge) > 0) ? ' & charges' : ''}`}
                  </Text>
                </View>
                <Text style={styles.summaryTotalAmount}>
                  ${(() => {
                    const taxTotal = parseFloat(taxData?.totalAmount) || parseFloat(totalAmount) || 0;
                    const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
                    const safeCouponDiscount = parseFloat(couponDiscount) || 0;
                    const finalAmount = taxTotal + safeDeliveryCharge - (appliedCoupon && couponDiscount > 0 ? safeCouponDiscount : 0);
                    return Math.round(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
                  })()}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>
                ${(() => {
                  const safeTotal = parseFloat(totalAmount) || 0;
                  const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
                  const total = safeTotal + safeDeliveryCharge;
                  return Math.round(isNaN(total) ? 0 : Math.max(0, total));
                })()}
              </Text>
            </View>
          )}
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
          <Text style={styles.footerTotalLabel}>
            Total: ${(() => {
              const taxTotal = parseFloat(taxData?.totalAmount) || parseFloat(totalAmount) || 0;
              const safeDeliveryCharge = parseFloat(deliveryCharge) || 0;
              const safeCouponDiscount = parseFloat(couponDiscount) || 0;
              const finalAmount = taxTotal + safeDeliveryCharge - (appliedCoupon && couponDiscount > 0 ? safeCouponDiscount : 0);
              return Math.round(isNaN(finalAmount) ? 0 : Math.max(0, finalAmount));
            })()}
          </Text>
          {/* {taxData && (
            <Text style={styles.footerTotalSubtext}>
              Including ${taxData.taxAmount} tax
              {taxData.platformCharge > 0 ? ` + $${taxData.platformCharge} platform charge` : ''}
            </Text>
          )} */}
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, (loading || isLoadingProfile || !userProfile || isLoadingTax || isLoadingDeliveryCharge || deliveryChargeError) && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading || isLoadingProfile || !userProfile || isLoadingTax || isLoadingDeliveryCharge || deliveryChargeError}>
          <Text style={styles.placeOrderButtonText}>
            {loading ? 'Placing Order...' : 
             isLoadingProfile ? 'Loading Profile...' : 
             isLoadingTax ? 'Calculating...' : 
             isLoadingDeliveryCharge ? 'Checking Delivery...' :
             deliveryChargeError ? 'Delivery Not Available' :
             !userProfile ? 'Profile Required' : 
             STRINGS.placeOrder}
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

      {/* Coupon Modal */}
      <Modal
        visible={isCouponModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCouponModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.couponModal}>
            <View style={styles.couponModalHeader}>
              <Text style={styles.couponModalTitle}>Available Coupons</Text>
              <TouchableOpacity onPress={() => setIsCouponModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {isLoadingCoupons ? (
              <View style={styles.couponLoadingContainer}>
                <Text style={styles.couponLoadingText}>Loading coupons...</Text>
              </View>
            ) : coupons.length === 0 ? (
              <View style={styles.noCouponsContainer}>
                <Ionicons name="pricetag-outline" size={60} color={COLORS.textSecondary} />
                <Text style={styles.noCouponsText}>No coupons available</Text>
              </View>
            ) : (
              <ScrollView style={styles.couponsList} showsVerticalScrollIndicator={false}>
                {coupons.map((coupon) => {
                  const now = new Date();
                  const expiryDateTime = new Date(`${coupon.expiryDate}T${coupon.expiryTime}`);
                  const isExpired = expiryDateTime < now;
                  
                  return (
                    <TouchableOpacity
                      key={coupon.id}
                      style={[styles.couponCard, isExpired && styles.couponCardExpired]}
                      onPress={() => !isExpired && applyCoupon(coupon.code)}
                      disabled={isExpired || isApplyingCoupon}>
                      <View style={styles.couponLeft}>
                        <View style={styles.couponDiscountBadge}>
                          <Text style={styles.couponDiscountText}>
                            {coupon.discountType === 'fixed' 
                              ? `$${coupon.discountValue}` 
                              : `${coupon.discountValue}%`}
                          </Text>
                          <Text style={styles.couponDiscountSubtext}>OFF</Text>
                        </View>
                      </View>
                      
                      <View style={styles.couponRight}>
                        <Text style={styles.couponCode}>{coupon.code}</Text>
                        <Text style={styles.couponMinAmount}>
                          Min order: ${coupon.minAmount}
                          {coupon.maxAmount && ` | Max: $${coupon.maxAmount}`}
                        </Text>
                        <Text style={[styles.couponExpiry, isExpired && styles.couponExpired]}>
                          {isExpired ? 'Expired' : `Valid till ${coupon.expiryDate}`}
                        </Text>
                      </View>
                      
                      {!isExpired && (
                        <View style={styles.couponApplyButton}>
                          <Text style={styles.couponApplyText}>APPLY</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
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
  footerTotalSubtext: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  // Order Summary Styles
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryHeaderTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: spacing.xs,
  },
  summaryLoadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  summaryLoadingText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: fontSize.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  freeDelivery: {
    fontSize: fontSize.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  deliveryErrorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.error + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  deliveryErrorText: {
    fontSize: fontSize.xs,
    color: COLORS.error,
    fontWeight: '600',
    flex: 1,
    marginLeft: spacing.xs,
    lineHeight: fontSize.sm,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: spacing.sm,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  summaryTotalLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  summaryTotalSubtext: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryTotalAmount: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  discountLabel: {
    color: COLORS.success,
  },
  discountValue: {
    fontSize: fontSize.sm,
    color: COLORS.success,
    fontWeight: '700',
  },
  // Coupon Section Styles
  couponSection: {
    paddingVertical: spacing.xs,
  },
  couponIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  couponSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: spacing.xs,
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  appliedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedCouponText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  appliedCouponCode: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 2,
  },
  appliedCouponSavings: {
    fontSize: fontSize.xs,
    color: COLORS.success,
    fontWeight: '500',
  },
  removeCouponButton: {
    padding: spacing.xs / 2,
  },
  viewCouponsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary + '60',
  },
  viewCouponsButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Coupon Modal Styles
  couponModal: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    position: 'absolute',
    bottom: 0,
  },
  couponModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  couponModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  couponLoadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  couponLoadingText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  noCouponsContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
  },
  noCouponsText: {
    fontSize: fontSize.lg,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: spacing.md,
  },
  couponsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  couponCardExpired: {
    opacity: 0.5,
    borderColor: COLORS.textSecondary,
  },
  couponLeft: {
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  couponDiscountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: wp('18%'),
  },
  couponDiscountText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: COLORS.white,
  },
  couponDiscountSubtext: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 2,
  },
  couponRight: {
    flex: 1,
    justifyContent: 'center',
  },
  couponCode: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: spacing.xs / 2,
  },
  couponMinAmount: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.xs / 2,
  },
  couponExpiry: {
    fontSize: fontSize.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  couponExpired: {
    color: COLORS.error,
  },
  couponApplyButton: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  couponApplyText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: COLORS.primary,
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
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  editIcon: {
    marginLeft: spacing.xs,
  },
  tapToEditHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: COLORS.primary + '05',
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '30',
    gap: spacing.xs,
  },
  tapToEditText: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontStyle: 'italic',
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

