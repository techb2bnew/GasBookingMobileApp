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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, STRINGS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../redux/slices/profileSlice';
import { logout } from '../redux/slices/authSlice';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { profile, addresses, defaultAddressId } = useSelector(state => state.profile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [profileForm, setProfileForm] = useState(profile);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [addressForm, setAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    pincode: '',
    landmark: '',
  });

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        console.log('No token found, user not authenticated');
        return;
      }

      // Make API call to get user profile
      const response = await axios.get(
        `${STRINGS.API_BASE_URL}/api/auth/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

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
          address: userProfile?.address || null,
          isProfileComplete: userProfile?.isProfileComplete || false,
        }));

        // Update local form state
        setProfileForm({
          id: userProfile.id,
          name: userProfile.name || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          role: userProfile.role || 'customer',
          profileImage: userProfile.profileImage || null,
          address: userProfile.address || null,
          isProfileComplete: userProfile.isProfileComplete || false,
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

  // Fetch profile when component mounts
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  // Update profileForm when profile changes
  useFocusEffect(
    React.useCallback(() => {
      if (profile) {
        setProfileForm(profile);
      }
    }, [profile])
  );

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim()) {
      setValidationError('Name is required');
      return;
    }

    setValidationError(''); // Clear any previous validation errors

    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        console.log('Error', 'Authentication token not found');
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('name', profileForm?.name?.trim());
      formData.append('phone', profileForm?.phone || '');

      // Make API call to update profile
      const response = await axios.put(
        `${STRINGS.API_BASE_URL}/api/auth/profile`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Profile Update API Response:', response.data);

      if (response.data && response.data.success) {
        // Update local Redux state
        dispatch(updateProfile(profileForm));
        setIsEditingProfile(false);

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

  const handleAddAddress = () => {
    if (!addressForm.title.trim() || !addressForm.address.trim() || !addressForm.city.trim() || !addressForm.pincode.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (editingAddress) {
      dispatch(updateAddress({ id: editingAddress.id, ...addressForm }));
    } else {
      dispatch(addAddress(addressForm));
    }

    setAddressForm({
      title: '',
      address: '',
      city: '',
      pincode: '',
      landmark: '',
    });
    setEditingAddress(null);
    setIsAddressModalVisible(false);
    // Alert.alert('Success', editingAddress ? 'Address updated successfully' : 'Address added successfully');
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setIsAddressModalVisible(true);
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteAddress(addressId)),
        },
      ]
    );
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

  const handleDeleteAccount = () => {
    setIsDeleteAccountModalVisible(true);
  };

  const confirmDeleteAccount = () => {
    // Clear all user data
    dispatch(logout());
    // You can add additional cleanup here like clearing addresses, orders, etc.
    setIsDeleteAccountModalVisible(false);
    // Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
  };

  const renderAddressItem = (address) => (
    <View key={address.id} style={styles.addressItem}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressTitle}>
          {address.title.split(' ').slice(0, 3).join(' ')}
          {address.title.split(' ').length > 3 ? '...' : ''}
        </Text>
        {defaultAddressId === address.id && (
          <Text style={styles.defaultBadge}>Default</Text>
        )}
      </View>
      <Text style={styles.addressText}>{address.address}</Text>
      <Text style={styles.addressText}>{address.city}, {address.pincode}</Text>
      {address.landmark && (
        <Text style={styles.addressText}>Landmark: {address.landmark}</Text>
      )}

      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditAddress(address)}>
          <Text style={styles.actionButtonText}>{STRINGS.edit}</Text>
        </TouchableOpacity>

        {defaultAddressId !== address.id && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => dispatch(setDefaultAddress(address.id))}>
            <Text style={styles.actionButtonText}>{STRINGS.setAsDefault}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAddress(address.id)}>
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            {STRINGS.delete}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.profile}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{STRINGS.logout}</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <View style={styles.sectionActions}>
            {/* <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchUserProfile}
              disabled={isLoadingProfile}>
              <Text style={[styles.refreshButtonText, isLoadingProfile && { opacity: 0.5 }]}>
                {isLoadingProfile ? 'Refreshing...' : '🔄'}
              </Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={() => {
                if (isEditingProfile) {
                  handleUpdateProfile();
                } else {
                  setIsEditingProfile(true);
                  setProfileForm(profile);
                }
              }}>
              <Text style={styles.editButton}>
                {isEditingProfile ? STRINGS.save : STRINGS.edit}
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{STRINGS.phoneNumber}</Text>
              <TextInput
                style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                value={isEditingProfile ? profileForm.phone : (profile.phone || 'Not provided')}
                onChangeText={(text) => setProfileForm({ ...profileForm, phone: text })}
                editable={isEditingProfile}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{STRINGS.name}</Text>
              <TextInput
                style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                value={isEditingProfile ? profileForm.name : (profile.name || 'Not provided')}
                onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
                editable={isEditingProfile}
                placeholder="Enter your name"
              />
              {validationError && isEditingProfile && (
                <Text style={styles.validationError}>{validationError}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profile.email || 'Not provided'}
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
          {isEditingProfile && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsEditingProfile(false)}>
              <Text style={[styles.cancelButtonText, { color: COLORS.primary }]}>{STRINGS.cancel}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Addresses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{STRINGS.addresses}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddAddress')}>
            <Text style={styles.editButton}>{STRINGS.addAddress}</Text>
          </TouchableOpacity>
        </View>

        {addresses.length === 0 ? (
          <Text style={styles.emptyText}>No addresses added yet</Text>
        ) : (
          <>
            {addresses.map(renderAddressItem)}
            <TouchableOpacity
              style={styles.manageAddressesButton}
              onPress={() => navigation.navigate('AddAddress')}>
              <Text style={styles.manageAddressesButtonText}>Manage Addresses</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Address Modal */}
      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAddress ? STRINGS.editAddress : STRINGS.addAddress}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsAddressModalVisible(false);
                setEditingAddress(null);
                setAddressForm({
                  title: '',
                  address: '',
                  city: '',
                  pincode: '',
                  landmark: '',
                });
              }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={addressForm.title}
                onChangeText={(text) => setAddressForm({ ...addressForm, title: text })}
                placeholder="e.g., Home, Office"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={addressForm.address}
                onChangeText={(text) => setAddressForm({ ...addressForm, address: text })}
                placeholder="Enter full address"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={addressForm.city}
                onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                placeholder="Enter city"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                value={addressForm.pincode}
                onChangeText={(text) => setAddressForm({ ...addressForm, pincode: text })}
                placeholder="Enter pincode"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Landmark</Text>
              <TextInput
                style={styles.input}
                value={addressForm.landmark}
                onChangeText={(text) => setAddressForm({ ...addressForm, landmark: text })}
                placeholder="Enter landmark (optional)"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress}>
              <Text style={styles.saveButtonText}>{STRINGS.save}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>


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
                onPress={() => {
                  setIsLogoutModalVisible(false);
                  dispatch(logout());
                }}>
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
                style={[styles.confirmButton, styles.logoutConfirmButton]}
                onPress={confirmDeleteAccount}>
                <Text style={styles.logoutConfirmText}>Delete Account</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    fontSize: 23,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  deleteAccountButton: {
    backgroundColor: COLORS.error + '10',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  deleteAccountText: {
    color: COLORS.error,
    fontWeight: '500',
    fontSize: 14,
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: COLORS.error,
    borderRadius: 6,
  },
  logoutText: {
    color: COLORS.white,
    fontWeight: '500',
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
  },
  editButton: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
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
    height: 80,
    textAlignVertical: 'top',
  },
  cancelButton: {
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  addressItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  defaultBadge: {
    backgroundColor: COLORS.success,
    color: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 8,
    marginBottom: 5,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  manageAddressesButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  manageAddressesButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    marginRight: 10,
  },
  refreshButtonText: {
    fontSize: 18,
    color: COLORS.primary,
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

});

export default ProfileScreen;

