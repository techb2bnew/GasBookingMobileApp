import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, STRINGS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiConfig';
import {
  updateProfile,
  setProfileImage,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  clearAddresses,
  fetchAddresses,
  addAddressAPI,
  updateAddressAPI,
  deleteAddressAPI,
  clearAddressError,
} from '../redux/slices/profileSlice';
import { logout } from '../redux/slices/authSlice';
import { clearCart } from '../redux/slices/cartSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { profile, addresses, addressLoading, addressError } = useSelector(state => state.profile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: null,
  });
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [imageChanged, setImageChanged] = useState(false);
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [isViewAllAddressesModalVisible, setIsViewAllAddressesModalVisible] = useState(false);
  const [isEditAddressModalVisible, setIsEditAddressModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    pincode: '',
    landmark: '',
  });
  const [addressErrors, setAddressErrors] = useState({});


  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);

      // Make API call to get user profile
      const response = await apiClient.get('/api/auth/profile');

      console.log('Profile API Response:', response.data);

      if (response?.data && response?.data?.success) {
        const userProfile = response?.data?.data?.user;

        // Update Redux state with fresh profile data
        dispatch(updateProfile({
          id: userProfile?.id,
          name: userProfile?.name || '',
          email: userProfile?.email || '',
          phone: userProfile.phone || '',
          role: userProfile?.role || 'customer',
          profileImage: userProfile?.profileImage || null,
         }));

         // Update addresses if available
         if (userProfile?.addresses && Array.isArray(userProfile.addresses)) {
           // Clear existing addresses first
           dispatch(clearAddresses());
           userProfile.addresses.forEach(address => {
             dispatch(addAddress(address));
           });
         }

        // Update local form state
        setProfileForm({
          id: userProfile.id,
          name: userProfile.name || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          role: userProfile.role || 'customer',
          profileImage: userProfile.profileImage || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid, logout user
        console.error('Session Expired', 'Please login again');
        dispatch(logout());
        // Clear AsyncStorage
        await AsyncStorage.removeItem('userToken');
      } else {
        console.error('Error', 'Failed to fetch profile. Please try again.');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };


  // Fetch profile and addresses when component mounts
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
      dispatch(fetchAddresses());
    }, [])
  );

  // Clear address error after 5 seconds
  React.useEffect(() => {
    if (addressError) {
      const timer = setTimeout(() => {
        dispatch(clearAddressError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [addressError]);

  // Update profileForm when profile changes
  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profileImage: profile.profileImage || null,
      });
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    // Clear previous errors
    setValidationError('');
    setFieldErrors({});
    
    const errors = {};

    // Validation
    if (!profileForm.name || !profileForm.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!profileForm.phone || !profileForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (profileForm.phone && profileForm.phone.length !== 10) {
      errors.phone = 'Phone number must be 10 digits';
    }

    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('name', profileForm?.name?.trim());
      formData.append('phone', profileForm?.phone || '');

      // Console log the payload
      console.log('Profile Update Payload:', {
        name: profileForm?.name?.trim(),
        phone: profileForm?.phone || '',
      });

      // Make API call to update profile
      const response = await apiClient.put('/api/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Profile Update API Response:', response.data);

      if (response.data && response.data.success) {
        // Update local Redux state
        dispatch(updateProfile(profileForm));
        setIsEditingProfile(false);
         setImageChanged(false); // Reset image changed flag after save

        // Refresh profile data from server
        await fetchUserProfile();

        console.log('Success', 'Profile updated successfully');

      } else {
        console.log('Error', response.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile Update Error:', error);

      if (error.response?.status === 401) {
        // Token expired or invalid, logout user
        console.log('Session Expired', 'Please login again');
        dispatch(logout());
        await AsyncStorage.removeItem('userToken');
      } else {
        console.log('Error', error.response?.data?.message || 'Failed to update profile. Please try again.');
      }
    }
  };


  // const handleLogout = () => {
  //   Alert.alert(
  //     'Logout',
  //     'Are you sure you want to logout?',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Logout',
  //         style: 'destructive',
  //         onPress: () => dispatch(logout()),
  //       },
  //     ]
  //   );
  // };
  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        console.log('No token found, logging out locally');
        dispatch(logout());
        setIsLogoutModalVisible(false);
        return;
      }

      // Make API call to logout
      const response = await apiClient.post('/api/auth/logout', {});

      console.log('Logout API Response:', response.data);

      if (response.data && response.data.success) {
        console.log('Logout successful');
      } else {
        console.log('Logout API returned error:', response.data?.message);
      }
    } catch (error) {
      console.error('Logout API Error:', error);
      // Even if API call fails, we should still logout locally
      console.log('Logout API failed, logging out locally');
    } finally {
      // Only logout auth data, keep cart and other data
      dispatch(logout());
      await AsyncStorage.removeItem('userToken');
      setIsLogoutModalVisible(false);
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        console.log('No token found, clearing all data locally');
        // Clear all data including cart for account deletion
        dispatch(logout());
        dispatch(clearCart());
        dispatch(clearAddresses());
        await AsyncStorage.clear();
        setIsDeleteAccountModalVisible(false);
        return;
      }

      // Make API call to delete account
      const response = await apiClient.delete('/api/auth/account', {
        data: {
          confirmation: 'DELETE_MY_ACCOUNT'
        }
      });

      console.log('Delete Account API Response:', response.data);

      if (response.data && response.data.success) {
        console.log('Account deleted successfully');
        Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
      } else {
        console.log('Delete account API returned error:', response.data?.message);
        Alert.alert('Error', response.data?.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete Account API Error:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid, logout user
        console.log('Session expired during account deletion');
        Alert.alert('Session Expired', 'Please login again');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to delete account. Please try again.');
      }
    } finally {
      // Always clear ALL data including cart for account deletion
      dispatch(logout());
      dispatch(clearCart());        // Clear cart data
      dispatch(clearAddresses());   // Clear address data
      await AsyncStorage.clear();   // Clear all AsyncStorage
      setIsDeleteAccountModalVisible(false);
      setIsDeletingAccount(false);
    }
  };

  // Image upload functions
  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openImageLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        handleImageSelection(response.assets[0]);
      } else if (response.error) {
        console.log('Camera Error:', response.error);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    });
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        handleImageSelection(response.assets[0]);
      } else if (response.error) {
        console.log('Gallery Error:', response.error);
        Alert.alert('Error', 'Failed to select image. Please try again.');
      }
    });
  };

  const handleImageSelection = async (imageAsset) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageAsset.uri,
        type: imageAsset.type,
        name: imageAsset.fileName || 'profile.jpg',
      });

      const response = await apiClient.put('/api/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        const imageUrl = response.data.data.user.profileImage;
        dispatch(setProfileImage(imageUrl));
        setProfileForm({ ...profileForm, profileImage: imageUrl });
        setImageChanged(true); // Enable save button after image upload
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  // Address functions
  const validateAddressForm = () => {
    const errors = {};
    
    if (!addressForm.title.trim()) {
      errors.title = 'Address title is required';
    }
    if (!addressForm.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!addressForm.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      errors.pincode = 'Pincode must be 6 digits';
    }
    if (!addressForm.city.trim()) {
      errors.city = 'City is required';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) {
      // Focus on first error field
      const firstErrorField = Object.keys(addressErrors)[0];
      if (firstErrorField) {
        console.log('First error field:', firstErrorField);
      }
      return;
    }

    const addressPayload = {
      title: addressForm.title.trim(),
      address: addressForm.address.trim(),
      city: addressForm.city.trim(),
      pincode: addressForm.pincode.trim(),
      landmark: addressForm.landmark.trim(),
    };

    try {
      let result;
      if (editingAddressId) {
        // Update existing address
        result = await dispatch(updateAddressAPI({ addressId: editingAddressId, addressData: addressPayload }));
        if (result && result.payload) {
          setIsEditAddressModalVisible(false);
          Alert.alert('Success', 'Address updated successfully');
          // Refresh addresses after update
          dispatch(fetchAddresses());
        }
      } else {
        // Add new address
        result = await dispatch(addAddressAPI(addressPayload));
        if (result && result.payload) {
          setIsAddAddressModalVisible(false);
          // Set as default if it's the first address
          if (addresses.length === 0 && result && result.id) {
            dispatch(setDefaultAddress(result.id));
            Alert.alert('Success', 'Address added and set as default');
          } else {
            Alert.alert('Success', 'Address added successfully');
          }
          // Refresh addresses after adding
          dispatch(fetchAddresses());
        }
      }
      
      // Reset form and editing state
      setAddressForm({
        title: '',
        address: '',
        city: '',
        pincode: '',
        landmark: '',
      });
      setAddressErrors({});
      setEditingAddressId(null);
    } catch (error) {
      console.error('Address save error:', error);
      // Error handling is done in the Redux slice
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const result = await dispatch(deleteAddressAPI(addressId));
      if (result && result.payload) {
        Alert.alert('Success', 'Address deleted successfully');
        // Refresh addresses after deletion
        dispatch(fetchAddresses());
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      // Error handling is done in the Redux slice
    }
  };

  const openAddAddressModal = () => {
    setAddressForm({
      title: '',
      address: '',
      city: '',
      pincode: '',
      landmark: '',
    });
    setAddressErrors({});
    setEditingAddressId(null);
    setIsAddAddressModalVisible(true);
  };

  const openEditAddressModal = (address) => {
    setAddressForm({
      title: address.title || '',
      address: address.address || '',
      city: address.city || '',
      pincode: address.pincode || '',
      landmark: address.landmark || '',
    });
    setAddressErrors({});
    setEditingAddressId(address.id);
    setIsEditAddressModalVisible(true);
  };



  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.profile}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <View style={styles.sectionActions}>
            {/* Always show Edit/Save button */}
            <TouchableOpacity
              onPress={() => {
                if (isEditingProfile || (!profile || !profile.name || !profile.name.trim())) {
                  handleUpdateProfile();
                } else {
                  setIsEditingProfile(true);
                  if (profile) {
                    setProfileForm({
                      name: profile.name || '',
                      email: profile.email || '',
                      phone: profile.phone || '',
                      profileImage: profile.profileImage || null,
                    });
                  }
                }
              }}>
              <Text style={styles.editButton}>
                {isEditingProfile || (!profile || !profile.name || !profile.name.trim()) ? STRINGS.save : STRINGS.edit}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoadingProfile ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : profile ? (
          <>
            {/* Profile Image Section */}
            <View style={styles.profileImageSection}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={showImagePicker}>
                {profile && profile.profileImage ? (
                  <Image
                    source={{ uri: profile.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImagePlaceholderText}>
                      {profile && profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.imageEditOverlay}>
                  <Text style={styles.imageEditText}>📷</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.imageEditHint}>Tap to upload photo</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{STRINGS.name}</Text>
              <TextInput
                style={[
                  styles.input, 
                  (!isEditingProfile && profile && profile.name && profile.name.trim()) && styles.inputDisabled,
                  fieldErrors.name && styles.inputError
                ]}
                value={profileForm.name}
                onChangeText={(text) => {
                  setProfileForm({ ...profileForm, name: text });
                  // Clear name error when user starts typing
                  if (fieldErrors.name) {
                    setFieldErrors({ ...fieldErrors, name: null });
                  }
                }}
                editable={isEditingProfile || !profile || !profile.name || !profile.name.trim()}
                placeholder="Enter your name"
              />
              {fieldErrors.name && (
                <Text style={styles.validationError}>{fieldErrors.name}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{STRINGS.phoneNumber}</Text>
              <TextInput
                style={[
                  styles.input, 
                  (!isEditingProfile && profile && profile.name && profile.name.trim()) && styles.inputDisabled,
                  fieldErrors.phone && styles.inputError
                ]}
                value={profileForm.phone}
                onChangeText={(text) => {
                  // Only allow 10 digits
                  const cleanedText = text.replace(/[^0-9]/g, '');
                  if (cleanedText.length <= 10) {
                    setProfileForm({ ...profileForm, phone: cleanedText });
                    // Clear phone error when user starts typing
                    if (fieldErrors.phone) {
                      setFieldErrors({ ...fieldErrors, phone: null });
                    }
                  }
                }}
                editable={isEditingProfile || !profile || !profile.name || !profile.name.trim()}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                maxLength={10}
              />
              {fieldErrors.phone && (
                <Text style={styles.validationError}>{fieldErrors.phone}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profile && profile.email ? profile.email : 'Not provided'}
                editable={false}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyProfileContainer}>
            <Text style={styles.emptyProfileText}>No profile data available</Text>
            <TouchableOpacity style={styles.refreshProfileButton} onPress={fetchUserProfile}>
              <Text style={styles.refreshProfileButtonText}>Refresh Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Buttons Row */}
        <View style={styles.buttonsRow}>
          {/* Show Save button for new users when they start typing */}

          {isEditingProfile && (
            <TouchableOpacity
              style={styles.cancelButton}
               onPress={() => {
                 setIsEditingProfile(false);
                 setImageChanged(false); // Reset image changed flag on cancel
               }}>
              <Text style={[styles.cancelButtonText, { color: COLORS.primary }]}>{STRINGS.cancel}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Address Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          <TouchableOpacity onPress={openAddAddressModal} disabled={addressLoading}>
            <Text style={[styles.editButton, addressLoading && styles.disabledButton]}>Add Address</Text>
          </TouchableOpacity>
        </View>

        {addressLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading addresses...</Text>
          </View>
        ) : addressError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{addressError}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => dispatch(fetchAddresses())}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : addresses.length > 0 ? (
          <>
                         {/* Show first address */}
             <View style={styles.addressCard}>
               <View style={styles.addressHeader}>
                 <Text style={styles.addressTitle}>
                   {addresses[0].title?.charAt(0).toUpperCase() + addresses[0].title?.slice(1).toLowerCase()}
                 </Text>
            <TouchableOpacity
                   onPress={() => openEditAddressModal(addresses[0])}
                   style={styles.editAddressButton}>
                   <Icon name="edit" size={18} color={COLORS.primary} />
            </TouchableOpacity>
               </View>
               <Text style={styles.addressText}>{addresses[0].address}</Text>
               {addresses[0].landmark && (
                 <Text style={styles.landmarkText}>Landmark: {addresses[0].landmark}</Text>
               )}
               <Text style={styles.pincodeText}>
                 {addresses[0].city} - {addresses[0].pincode}
               </Text>
             </View>

            {/* View All Addresses Button */}
            {addresses.length > 1 && (
              <TouchableOpacity
                style={styles.viewAllAddressesButton}
                onPress={() => setIsViewAllAddressesModalVisible(true)}>
                <Text style={styles.viewAllAddressesText}>
                  View All Addresses ({addresses.length})
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyAddressContainer}>
            <Text style={styles.emptyAddressText}>No addresses added yet</Text>
            <TouchableOpacity style={styles.addFirstAddressButton} onPress={openAddAddressModal}>
              <Text style={styles.addFirstAddressText}>Add Your First Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        visible={isLogoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Logout</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.confirmActions}>
            <TouchableOpacity
                style={[styles.confirmButton, styles.logoutcancelButton]}
                onPress={() => setIsLogoutModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.logoutConfirmButton]}
                onPress={confirmLogout}>
                <Text style={styles.logoutConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={isDeleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteAccountModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete Account</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.logoutcancelButton]}
                onPress={() => setIsDeleteAccountModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.logoutConfirmButton, isDeletingAccount && styles.disabledButton]}
                onPress={confirmDeleteAccount}
                disabled={isDeletingAccount}>
                <Text style={styles.logoutConfirmText}>
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
             </Modal>

       {/* Add Address Modal */}
       <Modal
         visible={isAddAddressModalVisible}
         transparent
         animationType="slide"
         onRequestClose={() => setIsAddAddressModalVisible(false)}>
         <View style={styles.modalOverlay}>
           <View style={styles.addressModal}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Add New Address</Text>
               <TouchableOpacity onPress={() => setIsAddAddressModalVisible(false)}>
                 <Icon name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
               {/* Address Title */}
            <View style={styles.inputGroup}>
                 <Text style={styles.label}>Address Title *</Text>
              <TextInput
                   style={[styles.input, addressErrors.title && styles.inputError]}
                value={addressForm.title}
                onChangeText={(text) => setAddressForm({ ...addressForm, title: text })}
                   placeholder="e.g., Home, Office, Parents House"
              />
                 {addressErrors.title && (
                   <Text style={styles.validationError}>{addressErrors.title}</Text>
                 )}
            </View>

               {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                   style={[styles.input, styles.textArea, addressErrors.address && styles.inputError]}
                value={addressForm.address}
                onChangeText={(text) => setAddressForm({ ...addressForm, address: text })}
                   placeholder="Enter complete address"
                multiline
                numberOfLines={3}
              />
                 {addressErrors.address && (
                   <Text style={styles.validationError}>{addressErrors.address}</Text>
                 )}
            </View>

               {/* Landmark */}
            <View style={styles.inputGroup}>
                 <Text style={styles.label}>Landmark</Text>
              <TextInput
                style={styles.input}
                   value={addressForm.landmark}
                   onChangeText={(text) => setAddressForm({ ...addressForm, landmark: text })}
                   placeholder="e.g., Near Metro Station, Behind Mall"
              />
            </View>

               {/* Pincode */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                   style={[styles.input, addressErrors.pincode && styles.inputError]}
                value={addressForm.pincode}
                onChangeText={(text) => setAddressForm({ ...addressForm, pincode: text })}
                   placeholder="Enter 6-digit pincode"
                keyboardType="numeric"
                maxLength={6}
              />
                 {addressErrors.pincode && (
                   <Text style={styles.validationError}>{addressErrors.pincode}</Text>
                 )}
            </View>

               {/* City */}
            <View style={styles.inputGroup}>
                 <Text style={styles.label}>City *</Text>
              <TextInput
                   style={[styles.input, addressErrors.city && styles.inputError]}
                   value={addressForm.city}
                   onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                   placeholder="Enter city name"
                 />
                 {addressErrors.city && (
                   <Text style={styles.validationError}>{addressErrors.city}</Text>
                 )}
            </View>
             </ScrollView>

             <View style={styles.modalActions}>
               <TouchableOpacity
                 style={styles.cancelModalButton}
                 onPress={() => setIsAddAddressModalVisible(false)}>
                 <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
               <TouchableOpacity
                 style={[styles.saveAddressButton, addressLoading && styles.saveButtonDisabled]}
                 onPress={handleSaveAddress}
                 disabled={addressLoading}>
                 <Text style={styles.saveAddressButtonText}>
                   {addressLoading ? 'Saving...' : 'Save Address'}
                 </Text>
               </TouchableOpacity>
             </View>
           </View>
        </View>
      </Modal>

       {/* View All Addresses Modal */}
      <Modal
         visible={isViewAllAddressesModalVisible}
        transparent
         animationType="slide"
         onRequestClose={() => setIsViewAllAddressesModalVisible(false)}>
        <View style={styles.modalOverlay}>
           <View style={styles.addressModal}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>All Addresses</Text>
               <TouchableOpacity onPress={() => setIsViewAllAddressesModalVisible(false)}>
                 <Icon name="close" size={24} color={COLORS.text} />
               </TouchableOpacity>
             </View>

             <ScrollView style={styles.modalContent}>
               {addresses.map((address, index) => (
                 <View key={address.id} style={styles.addressCard}>
                   <View style={styles.addressHeader}>
                     <Text style={styles.addressTitle}>
                       {address.title?.charAt(0).toUpperCase() + address.title?.slice(1).toLowerCase()}
                     </Text>
                     <View style={styles.addressActions}>
              <TouchableOpacity
                         onPress={() => openEditAddressModal(address)}
                         style={styles.editAddressButton}>
                         <Icon name="edit" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                         onPress={() => handleDeleteAddress(address.id)}
                         style={styles.deleteAddressButton}>
                         <Icon name="close" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
                   </View>
                   <Text style={styles.addressText}>{address.address}</Text>
                   {address.landmark && (
                     <Text style={styles.landmarkText}>Landmark: {address.landmark}</Text>
                   )}
                   <Text style={styles.pincodeText}>
                     {address.city} - {address.pincode}
                   </Text>
                 </View>
               ))}
             </ScrollView>
          </View>
        </View>
      </Modal>

       {/* Edit Address Modal */}
      <Modal
         visible={isEditAddressModalVisible}
        transparent
         animationType="slide"
         onRequestClose={() => setIsEditAddressModalVisible(false)}>
        <View style={styles.modalOverlay}>
           <View style={styles.addressModal}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Edit Address</Text>
               <TouchableOpacity onPress={() => setIsEditAddressModalVisible(false)}>
                 <Icon name="close" size={24} color={COLORS.text} />
               </TouchableOpacity>
             </View>

             <ScrollView style={styles.modalContent}>
               {/* Address Title */}
               <View style={styles.inputGroup}>
                 <Text style={styles.label}>Address Title *</Text>
                 <TextInput
                   style={[styles.input, addressErrors.title && styles.inputError]}
                   value={addressForm.title}
                   onChangeText={(text) => setAddressForm({ ...addressForm, title: text })}
                   placeholder="e.g., Home, Office, Parents House"
                 />
                 {addressErrors.title && (
                   <Text style={styles.validationError}>{addressErrors.title}</Text>
                 )}
               </View>

               {/* Address */}
               <View style={styles.inputGroup}>
                 <Text style={styles.label}>Address *</Text>
                 <TextInput
                   style={[styles.input, styles.textArea, addressErrors.address && styles.inputError]}
                   value={addressForm.address}
                   onChangeText={(text) => setAddressForm({ ...addressForm, address: text })}
                   placeholder="Enter complete address"
                   multiline
                   numberOfLines={3}
                 />
                 {addressErrors.address && (
                   <Text style={styles.validationError}>{addressErrors.address}</Text>
                 )}
               </View>

               {/* Landmark */}
               <View style={styles.inputGroup}>
                 <Text style={styles.label}>Landmark</Text>
                 <TextInput
                   style={styles.input}
                   value={addressForm.landmark}
                   onChangeText={(text) => setAddressForm({ ...addressForm, landmark: text })}
                   placeholder="e.g., Near Metro Station, Behind Mall"
                 />
               </View>

               {/* Pincode */}
               <View style={styles.inputGroup}>
                 <Text style={styles.label}>Pincode *</Text>
                 <TextInput
                   style={[styles.input, addressErrors.pincode && styles.inputError]}
                   value={addressForm.pincode}
                   onChangeText={(text) => setAddressForm({ ...addressForm, pincode: text })}
                   placeholder="Enter 6-digit pincode"
                   keyboardType="numeric"
                   maxLength={6}
                 />
                 {addressErrors.pincode && (
                   <Text style={styles.validationError}>{addressErrors.pincode}</Text>
                 )}
               </View>

               {/* City */}
               <View style={styles.inputGroup}>
                 <Text style={styles.label}>City *</Text>
                 <TextInput
                   style={[styles.input, addressErrors.city && styles.inputError]}
                   value={addressForm.city}
                   onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                   placeholder="Enter city name"
                 />
                 {addressErrors.city && (
                   <Text style={styles.validationError}>{addressErrors.city}</Text>
                 )}
               </View>
             </ScrollView>

             <View style={styles.modalActions}>
              <TouchableOpacity
                 style={styles.cancelModalButton}
                 onPress={() => setIsEditAddressModalVisible(false)}>
                 <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                 style={[styles.saveAddressButton, addressLoading && styles.saveButtonDisabled]}
                 onPress={handleSaveAddress}
                 disabled={addressLoading}>
                 <Text style={styles.saveAddressButtonText}>
                   {addressLoading ? 'Updating...' : 'Update Address'}
                 </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  deleteAccountButton: {
    backgroundColor: COLORS.error + '10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  deleteAccountText: {
    color: COLORS.error,
    fontWeight: '500',
    fontSize: 13,
  },
  logoutButton: {
    padding: 6,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    marginTop: 10,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  editButton: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 3,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: COLORS.white,
  },
  inputDisabled: {
    backgroundColor: COLORS.lightGray,
    color: COLORS.textSecondary,
  },
  phoneInput: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  cancelButton: {
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  logoutcancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  logoutConfirmButton: {
    backgroundColor: COLORS.error,
  },
  logoutConfirmText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyProfileText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 15,
  },
  refreshProfileButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshProfileButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  validationError: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 5,
  },
  saveProfileButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveProfileButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileImagePlaceholderText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  imageEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  imageEditText: {
    fontSize: 12,
  },
     imageEditHint: {
     fontSize: 11,
     color: COLORS.textSecondary,
     textAlign: 'center',
   },
   // Address styles
   addressCard: {
     backgroundColor: COLORS.white,
     padding: 12,
     borderRadius: 10,
     marginBottom: 6,
     borderWidth: 1,
     borderColor: COLORS.border,
   },
   addressHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 6,
   },
   addressTitle: {
     fontSize: 14,
     fontWeight: '600',
     color: COLORS.text,
   },
   addressText: {
     fontSize: 13,
     color: COLORS.text,
     lineHeight: 18,
     marginBottom: 3,
   },
   landmarkText: {
     fontSize: 11,
     color: COLORS.textSecondary,
     marginBottom: 3,
   },
   pincodeText: {
     fontSize: 11,
     color: COLORS.textSecondary,
     fontWeight: '500',
   },
   viewAllAddressesButton: {
     backgroundColor: COLORS.primary + '10',
     paddingVertical: 8,
     paddingHorizontal: 12,
     borderRadius: 6,
     alignItems: 'center',
     marginTop: 6,
     borderWidth: 1,
     borderColor: COLORS.primary + '30',
   },
   viewAllAddressesText: {
     color: COLORS.primary,
     fontWeight: '500',
     fontSize: 13,
   },
  emptyAddressContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyAddressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  addFirstAddressButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addFirstAddressText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
   // Modal styles
   addressModal: {
     width: '90%',
     maxHeight: '80%',
     backgroundColor: COLORS.white,
     borderRadius: 16,
     overflow: 'hidden',
   },
   modalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 20,
     borderBottomWidth: 1,
     borderBottomColor: COLORS.border,
   },
   modalTitle: {
     fontSize: 18,
     fontWeight: '600',
     color: COLORS.text,
   },
   modalContent: {
     maxHeight: 400,
     padding: 20,
   },
   modalActions: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     padding: 20,
     borderTopWidth: 1,
     borderTopColor: COLORS.border,
   },
   cancelModalButton: {
     flex: 1,
     backgroundColor: COLORS.lightGray,
     paddingVertical: 12,
     borderRadius: 8,
     alignItems: 'center',
     marginRight: 10,
   },
   cancelModalButtonText: {
     color: COLORS.text,
     fontWeight: '600',
   },
   saveAddressButton: {
     flex: 1,
     backgroundColor: COLORS.primary,
     paddingVertical: 12,
     borderRadius: 8,
     alignItems: 'center',
     marginLeft: 10,
   },
   saveAddressButtonText: {
     color: COLORS.white,
     fontWeight: '600',
   },
   // Input error styles
   inputError: {
     borderColor: COLORS.error,
   },
   deleteAddressButton: {
     padding: 5,
   },
   // Address actions styles
   addressActions: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   editAddressButton: {
     padding: 5,
     marginRight: 10,
  },
  // Loading and error styles
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },

});

export default ProfileScreen;

