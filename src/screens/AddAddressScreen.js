import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, STRINGS } from '../constants';
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../redux/slices/profileSlice';
import MapPicker from '../components/MapPicker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AddAddressScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { addresses, defaultAddressId } = useSelector(state => state.profile);
  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showForm, setShowForm] = useState(false); // 👈 NEW
  const [addressForm, setAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    pincode: '',
    landmark: '',
  });
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (addresses.length === 1 && !defaultAddressId) {
      dispatch(setDefaultAddress(addresses[0].id));
    }
  }, [addresses.length, defaultAddressId, dispatch]);

  const handleAddAddress = () => {
    const newErrors = {};
    if (!addressForm.title.trim()) newErrors.title = 'Title is required';
    if (!addressForm.address.trim()) newErrors.address = 'Address is required';
    if (!addressForm.city.trim()) newErrors.city = 'City is required';
    if (!addressForm.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(addressForm.pincode)) newErrors.pincode = 'Pincode must be 6 digits';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Clear errors if validation passes

    if (editingAddress) {
      dispatch(updateAddress({ id: editingAddress.id, ...addressForm }));
      console.log('Success', 'Address updated successfully');
    } else {
      const newAddress = {
        id: Date.now().toString(),
        ...addressForm,
      };
      dispatch(addAddress(newAddress));

      if (addresses.length === 0) {
        dispatch(setDefaultAddress(newAddress.id));
        console.log('Success', 'Address added and set as default');
      } else {
        console.log('Success', 'Address added successfully. Please select a default address.');
      }
    }

    // Reset form and close it
    setAddressForm({ title: '', address: '', city: '', pincode: '', landmark: '' });
    setEditingAddress(null);
    setIsEditing(false);
    setShowForm(false);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setIsEditing(true);
    setShowForm(true); // open form for editing
  };

  const handleDeleteAddress = (addressId) => {
    if (addresses.length === 1) {
      Alert.alert('Error', 'Cannot delete the last address. Please add another address first.');
      return;
    }

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteAddress(addressId));
            if (defaultAddressId === addressId) {
              const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
              if (remainingAddresses.length > 0) {
                dispatch(setDefaultAddress(remainingAddresses[0].id));
              }
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = (addressId) => {
    dispatch(setDefaultAddress(addressId));
    console.log('Success', 'Default address updated successfully');
  };

  const handleCancelEdit = () => {
    setAddressForm({ title: '', address: '', city: '', pincode: '', landmark: '' });
    setEditingAddress(null);
    setIsEditing(false);
    setShowForm(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setAddressForm({
      ...addressForm,
      title: location.title || 'Home',
      address: location.address,
      city: location.city || '',
      pincode: location.pincode || '',
      landmark: location.landmark || '',
    });
    setIsMapModalVisible(false);
  };

  const openMapPicker = () => {
    setIsMapModalVisible(true);
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
            onPress={() => handleSetDefault(address.id)}>
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

  const renderAddressForm = () => (
    <View style={styles.formSection}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </Text>
        {isEditing && (
          <TouchableOpacity onPress={handleCancelEdit}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={addressForm.title}
          onChangeText={(text) => setAddressForm({ ...addressForm, title: text })}
          placeholder="e.g., Home, Office"
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address *</Text>
        <View style={styles.addressInputContainer}>
          <TextInput
            style={[styles.input, styles.textArea, styles.addressInput]}
            value={addressForm.address}
            onChangeText={(text) => setAddressForm({ ...addressForm, address: text })}
            placeholder="Enter full address"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.mapButton}
            onPress={openMapPicker}>
            <Ionicons name="map" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          value={addressForm.city}
          onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
          placeholder="Enter city"
        />
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

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
        {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}

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
        <Text style={styles.saveButtonText}>
          {isEditing ? 'Update Address' : 'Add Address'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Addresses</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Empty Message */}
        {addresses.length === 0 && !showForm && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No addresses added yet</Text>
            <Text style={styles.emptySubtext}>Add your first address to get started</Text>
          </View>
        )}

        {/* Address List */}
        {addresses.length > 0 && addresses.map(renderAddressItem)}

        {/* Address Form */}
        {showForm && renderAddressForm()}

        {/* Add Button (shown only when form is closed) */}
        {!showForm && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.addButtonText}>+ Add Address</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Map Picker Modal */}
      <Modal
        visible={isMapModalVisible}
        animationType="slide"
        presentationStyle="fullScreen">
        <SafeAreaView style={styles.mapModalContainer}>
          <MapPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={selectedLocation}
          />
          <TouchableOpacity
            style={styles.closeMapButton}
            onPress={() => setIsMapModalVisible(false)}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapModalContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 5,
  },
  backButton: { paddingVertical: 5 },
  title: { fontSize: 20, fontWeight: '600', color: COLORS.white },
  placeholder: { width: 40 },
  content: { flex: 1 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: COLORS.textLight, textAlign: 'center' },
  formSection: {
    backgroundColor: COLORS.cardBackground,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20,
  },
  formTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  cancelButtonText: { color: COLORS.textSecondary, fontSize: 16 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: COLORS.text, marginBottom: 5, fontWeight: '500' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: COLORS.white,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12,
    alignItems: 'center', marginTop: 15,
  },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  addressItem: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 15, margin: 15, marginBottom: 10, backgroundColor: COLORS.white,
  },
  addressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  addressTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  defaultBadge: {
    backgroundColor: COLORS.success, color: COLORS.white,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
    fontSize: 12, fontWeight: '500',
  },
  addressText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 2 },
  addressActions: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  actionButton: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.primary, marginRight: 8, marginBottom: 5,
  },
  actionButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: '500' },
  deleteButton: { borderColor: COLORS.error },
  deleteButtonText: { color: COLORS.error },
  addButton: {
    backgroundColor: COLORS.primary,
    margin: 15,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
    marginRight: 8,
  },
  mapButton: {
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeMapButton: {
    position: 'absolute',
    top: Platform.OS === "ios" ? 50 : 10,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AddAddressScreen;
