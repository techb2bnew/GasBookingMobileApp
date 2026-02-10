import React, {useState, useEffect} from 'react';
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
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {COLORS, STRINGS} from '../constants';
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  fetchAddresses,
  addAddressAPI,
  updateAddressAPI,
  deleteAddressAPI,
  clearAddressError,
} from '../redux/slices/profileSlice';
import {setSelectedAddress} from '../redux/slices/cartSlice';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {wp, hp, fontSize, spacing, borderRadius} from '../utils/dimensions';
import MapPicker from '../components/MapPicker';

const AddAddressScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {addresses, defaultAddressId, addressLoading, addressError} =
    useSelector(state => state.profile);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showForm, setShowForm] = useState(false); // 👈 NEW
  const [addressForm, setAddressForm] = useState({
    title: '',
    address: '',
    city: '',
    // pincode: '',
    landmark: '',
  });
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    // Fetch addresses when component mounts
    dispatch(fetchAddresses());
  }, [dispatch]);

  // Set default address when addresses are loaded
  useEffect(() => {
    if (addresses.length > 0 && defaultAddressId) {
      const defaultAddress = addresses.find(
        addr => addr.id === defaultAddressId,
      );
      if (defaultAddress) {
        dispatch(setSelectedAddress(defaultAddress));
      }
    }
  }, [addresses, defaultAddressId, dispatch]);

  useEffect(() => {
    if (addresses.length === 1 && !defaultAddressId) {
      dispatch(setDefaultAddress(addresses[0].id));
      dispatch(setSelectedAddress(addresses[0]));
    }
  }, [addresses.length, defaultAddressId, dispatch]);

  // Clear address error when component unmounts or when user starts typing
  useEffect(() => {
    if (addressError) {
      const timer = setTimeout(() => {
        dispatch(clearAddressError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [addressError, dispatch]);

  const handleAddAddress = async () => {
    const newErrors = {};
    if (!addressForm.title.trim()) newErrors.title = 'Title is required';
    if (!addressForm.address.trim()) newErrors.address = 'Address is required';
    if (!addressForm.city.trim()) newErrors.city = 'City is required';
    // if (!addressForm.pincode.trim()) newErrors.pincode = 'Pincode is required';
    // else if (!/^\d{6}$/.test(addressForm.pincode))
    //   newErrors.pincode = 'Pincode must be 6 digits';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Clear errors if validation passes

    try {
      if (editingAddress) {
        // Update existing address
        const result = await dispatch(
          updateAddressAPI({
            addressId: editingAddress.id,
            addressData: addressForm,
          }),
        ).unwrap();

        console.log('Address updated successfully:', result);
        Alert.alert('Success', 'Address updated successfully');
        // Refresh addresses after update
        dispatch(fetchAddresses());
      } else {
        // Add new address
        const result = await dispatch(addAddressAPI(addressForm)).unwrap();

        console.log('Address added successfully:', result);
        if (addresses.length === 0 && result && result.id) {
          dispatch(setDefaultAddress(result.id));
          Alert.alert('Success', 'Address added and set as default');
        } else {
          Alert.alert('Success', 'Address added successfully');
        }
        // Refresh addresses after adding
        dispatch(fetchAddresses());
      }

      // Reset form and close it
      setAddressForm({
        title: '',
        address: '',
        city: '',
        // pincode: '',
        landmark: '',
      });
      setEditingAddress(null);
      setIsEditing(false);
      setShowForm(false);
    } catch (error) {
      console.log('Address save error:', error);
      // Only show error alert if it's a real error, not a success with error message
      if (
        error &&
        typeof error === 'string' &&
        !error.includes('successfully')
      ) {
        Alert.alert('Error', error);
      }
    }
  };

  const handleEditAddress = address => {
    setEditingAddress(address);
    setAddressForm(address);
    setIsEditing(true);
    setShowForm(true); // open form for editing
  };

  const handleDeleteAddress = addressId => {
    if (addresses.length === 1) {
      Alert.alert(
        'Error',
        'Cannot delete the last address. Please add another address first.',
      );
      return;
    }

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteAddressAPI(addressId)).unwrap();
              Alert.alert('Success', 'Address deleted successfully');
              // Refresh addresses after deletion
              dispatch(fetchAddresses());
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete address');
            }
          },
        },
      ],
    );
  };

  const handleSetDefault = addressId => {
    dispatch(setDefaultAddress(addressId));

    // Find the selected address and set it as selected for checkout
    const selectedAddress = addresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      dispatch(setSelectedAddress(selectedAddress));
    }
    console.log('Success', 'Default address updated successfully');
  };

  const handleCancelEdit = () => {
    setAddressForm({
      title: '',
      address: '',
      city: '',
      // pincode: '',
      landmark: '',
    });
    setEditingAddress(null);
    setIsEditing(false);
    setShowForm(false);
  };

  const handleLocationSelect = location => {
    setSelectedLocation(location);
    setAddressForm({
      ...addressForm,
      title: location.title || 'Home',
      address: location.address,
      city: location.city || '',
      // pincode: location.pincode || '',
      landmark: location.landmark || '',
    });
    setIsMapModalVisible(false);
  };

  const openMapPicker = () => {
    setIsMapModalVisible(true);
  };

  const renderAddressItem = address => (
    <View
      key={address.id}
      style={[
        styles.addressItem,
        defaultAddressId === address.id && styles.selectedAddressItem,
      ]}>
      <TouchableOpacity
        style={styles.addressSelectionArea}
        onPress={() => handleSetDefault(address.id)}
        activeOpacity={0.7}>
        <View style={styles.selectionIndicator}>
          {defaultAddressId === address.id ? (
            <Ionicons name="radio-button-on" size={20} color={COLORS.blue} />
          ) : (
            <Ionicons
              name="radio-button-off"
              size={20}
              color={COLORS.textSecondary}
            />
          )}
        </View>

        <View style={styles.addressContent}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressTitle}>
              {address.title?.charAt(0).toUpperCase() +
                address.title?.slice(1).toLowerCase()}
            </Text>
            {defaultAddressId === address.id && (
              <Text style={styles.defaultBadge}>Default</Text>
            )}
          </View>
          <Text style={styles.addressText}>{address.address}</Text>
          <Text style={styles.addressText}>
            {address.city}, 
            {/* {address.pincode} */}
          </Text>
          {address.landmark && (
            <Text style={styles.addressText}>Landmark: {address.landmark}</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditAddress(address)}>
          <Text style={styles.actionButtonText}>{STRINGS.edit}</Text>
        </TouchableOpacity>

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
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 10}}
        keyboardShouldPersistTaps="handled">
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
              onChangeText={text =>
                setAddressForm({...addressForm, title: text})
              }
              placeholder="e.g., Home, Office"
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.addressInputContainer}>
              <TextInput
                style={[styles.input, styles.textArea, styles.addressInput]}
                value={addressForm.address}
                onChangeText={text =>
                  setAddressForm({...addressForm, address: text})
                }
                placeholder="Enter full address"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.mapButton}
                onPress={openMapPicker}>
                <Ionicons name="location" size={22} color={COLORS.primary} />
                <Text style={styles.mapButtonLabel}>Map</Text>
              </TouchableOpacity>
            </View>
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={addressForm.city}
              onChangeText={text =>
                setAddressForm({...addressForm, city: text})
              }
              placeholder="Enter city"
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          {/* <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.input}
              value={addressForm.pincode}
              onChangeText={text =>
                setAddressForm({...addressForm, pincode: text})
              }
              placeholder="Enter pincode"
              keyboardType="numeric"
              maxLength={6}
            />
            {errors.pincode && (
              <Text style={styles.errorText}>{errors.pincode}</Text>
            )}
          </View> */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Landmark</Text>
            <TextInput
              style={styles.input}
              value={addressForm.landmark}
              onChangeText={text =>
                setAddressForm({...addressForm, landmark: text})
              }
              placeholder="Enter landmark (optional)"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              addressLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleAddAddress}
            disabled={addressLoading}>
            <Text style={styles.saveButtonText}>
              {addressLoading
                ? 'Saving...'
                : isEditing
                ? 'Update Address'
                : 'Add Address'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Help message for address selection */}
        {!addressLoading && !addressError && addresses.length > 1 && (
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Select a default address for checkout
            </Text>
          </View>
        )}

        {/* Loading State */}
        {addressLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading addresses...</Text>
          </View>
        )}

        {/* Error State */}
        {addressError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{addressError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => dispatch(fetchAddresses())}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty Message */}
        {!addressLoading &&
          !addressError &&
          addresses.length === 0 &&
          !showForm && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No addresses added yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first address to get started
              </Text>
            </View>
          )}

        {/* Address List */}
        {!addressLoading &&
          !addressError &&
          addresses.length > 0 &&
          addresses.map(renderAddressItem)}

        {/* Address Form */}
        {showForm && renderAddressForm()}

        {/* Add Button (shown only when form is closed) */}
        {!showForm && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}>
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
  container: {flex: 1, backgroundColor: COLORS.background},
  mapModalContainer: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: COLORS.primary,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingTop: 20
  },
  backButton: {
    width: 40,
  },
   title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: COLORS.white,
    // marginLeft: 10,
    letterSpacing: -0.5,
    marginBottom: wp('0.5%'),
  },
  placeholder: {width: wp('10%')},
  content: {flex: 1},
  emptyContainer: {alignItems: 'center', paddingVertical: wp('10%')},
  emptyText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: wp('1.25%'),
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: COLORS.cardBackground,
    margin: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  formTitle: {fontSize: fontSize.lg, fontWeight: '600', color: COLORS.text},
  cancelButtonText: {color: COLORS.textSecondary, fontSize: fontSize.md},
  inputGroup: {marginBottom: spacing.sm},
  label: {
    fontSize: fontSize.sm,
    color: COLORS.text,
    marginBottom: wp('1.25%'),
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    backgroundColor: COLORS.white,
  },
  textArea: {height: hp('10%'), textAlignVertical: 'top'},
  saveButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: wp('10%'),
  },
  loadingText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    backgroundColor: COLORS.errorBackground || '#ffebee',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  addressItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: COLORS.white,
  },
  selectedAddressItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  addressSelectionArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectionIndicator: {
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  addressContent: {
    flex: 1,
  },
  helpContainer: {
    backgroundColor: COLORS.primary + '10',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  helpText: {
    color: COLORS.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: wp('2%'),
  },
  addressTitle: {fontSize: fontSize.md, fontWeight: '600', color: COLORS.text},
  defaultBadge: {
    backgroundColor: COLORS.blue,
    color: COLORS.white,
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('0.5%'),
    borderRadius: wp('1%'),
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  addressText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: wp('0.5%'),
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: wp('1.5%'),
    borderRadius: wp('1%'),
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: wp('2%'),
    marginBottom: wp('1.25%'),
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  deleteButton: {borderColor: COLORS.error},
  deleteButtonText: {color: COLORS.error},
  addButton: {
    backgroundColor: COLORS.blue,
    margin: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: fontSize.sm,
    marginTop: wp('1%'),
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
    marginRight: wp('2%'),
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: COLORS.primary + '12',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  mapButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  closeMapButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    right: spacing.lg,
    backgroundColor: COLORS.primary,
    borderRadius: wp('5%'),
    width: wp('10%'),
    height: wp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AddAddressScreen;
