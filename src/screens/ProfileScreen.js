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
import { COLORS, STRINGS } from '../constants';
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
  const [addressForm, setAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    pincode: '',
    landmark: '',
  });

  const handleUpdateProfile = () => {
    if (!profileForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    dispatch(updateProfile(profileForm));
    setIsEditingProfile(false);
    Alert.alert('Success', 'Profile updated successfully');
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
    Alert.alert('Success', editingAddress ? 'Address updated successfully' : 'Address added successfully');
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
  const renderAddressItem = (address) => (
    <View key={address.id} style={styles.addressItem}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressTitle}>{address.title}</Text>
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{STRINGS.phoneNumber}</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={profile.phoneNumber}
            editable={false}
            placeholder="Phone number"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{STRINGS.name}</Text>
          <TextInput
            style={[styles.input, !isEditingProfile && styles.inputDisabled]}
            value={isEditingProfile ? profileForm.name : profile.name}
            onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
            editable={isEditingProfile}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{STRINGS.email}</Text>
          <TextInput
            style={[styles.input, !isEditingProfile && styles.inputDisabled]}
            value={isEditingProfile ? profileForm.email : profile.email}
            onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
            editable={isEditingProfile}
            placeholder="Enter your email"
            keyboardType="email-address"
          />
        </View>

        {isEditingProfile && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsEditingProfile(false)}>
            <Text style={[styles.cancelButtonText,{color:COLORS.primary}]}>{STRINGS.cancel}</Text>
          </TouchableOpacity>
        )}
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
  title: {
    fontSize: 23,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.5,
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
    alignItems: 'center',
    paddingVertical: 10,
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
});

export default ProfileScreen;

