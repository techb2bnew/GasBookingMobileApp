import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../constants';
import {wp, hp, fontSize, spacing, borderRadius} from '../utils/dimensions';
import {useAgencies} from '../hooks/useAgencies';
import {useDispatch, useSelector} from 'react-redux';
import {clearCart} from '../redux/slices/cartSlice';

const {width: screenWidth} = Dimensions.get('window');

const AgencySelectionScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'map'
  const [customerLocation, setCustomerLocation] = useState(null);
  const [agencyCoordinates, setAgencyCoordinates] = useState([]);
  const [selectedAgencyForModal, setSelectedAgencyForModal] = useState(null);
  const [isAgencyDetailsModalVisible, setIsAgencyDetailsModalVisible] = useState(false);
  const [isCartClearModalVisible, setIsCartClearModalVisible] = useState(false);
  const [pendingAgencySelection, setPendingAgencySelection] = useState(null);
  
  // Get cart state to check if cart has items
  const {items: cartItems, selectedAgency: cartSelectedAgency} = useSelector(state => state.cart);

  // Use Redux-based agencies management
  const {
    agencies,
    selectedAgency,
    selectedAgencyId,
    isLoading: isLoadingAgencies,
    error: agenciesError,
    fetchAgencies,
    selectAgency,
    hasAgencies,
    hasSelectedAgency
  } = useAgencies();

  // Get customer location when map tab is opened
  useEffect(() => {
    if (activeTab === 'map' && !customerLocation) {
      // Show loading immediately and get location in background
      getCurrentLocation();
    }
  }, [activeTab]);

  // Get agency coordinates when agencies are loaded
  useEffect(() => {
    if (agencies.length > 0 && agencyCoordinates.length === 0) {
      getAgencyCoordinates();
    }
  }, [agencies]);

  // Fetch agencies when screen comes into focus
  useEffect(() => {
    fetchAgencies();
  }, []);

  // Function to request location permissions
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby agencies.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Function to get current location using real GPS
  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log('📍 Location permission denied, using default location');
        // Fallback to default location immediately
        setCustomerLocation({
          latitude: 30.7046,
          longitude: 76.7179,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        return;
      }

      // Set a timeout to show default location if GPS takes too long
      const locationTimeout = setTimeout(() => {
        console.log('📍 GPS timeout, using default location');
        setCustomerLocation({
          latitude: 30.7046,
          longitude: 76.7179,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }, 5000); // 5 seconds timeout

      Geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(locationTimeout);
          const {latitude, longitude} = position.coords;
          console.log('📍 Real customer location:', {latitude, longitude});
          setCustomerLocation({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        },
        (error) => {
          clearTimeout(locationTimeout);
          console.log('❌ Location error:', error);
          // Fallback to default location
          setCustomerLocation({
            latitude: 30.7046,
            longitude: 76.7179,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        },
        {
          enableHighAccuracy: false, // Changed to false for faster location
          timeout: 8000, // Reduced timeout to 8 seconds
          maximumAge: 300000, // Accept location up to 5 minutes old
        }
      );
    } catch (error) {
      console.log('Error getting location:', error);
      // Fallback to default location
      setCustomerLocation({
        latitude: 30.7046,
        longitude: 76.7179,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  // Function to get coordinates from address using Google Geocoding API
  const getCoordinatesFromAddress = async (address) => {
    try {
      const GOOGLE_MAPS_APIKEY = 'AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI';
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }
      return null;
    } catch (error) {
      console.log('Error geocoding address:', error);
      return null;
    }
  };

  // Function to get coordinates for all agencies
  const getAgencyCoordinates = async () => {
    if (agencies.length === 0) return;
    
    const coordinates = [];
    for (const agency of agencies) {
      const fullAddress = `${agency.address}, ${agency.city}, ${agency.pincode}, India`;
      const coords = await getCoordinatesFromAddress(fullAddress);
      if (coords) {
        coordinates.push({
          ...agency,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      }
    }
    setAgencyCoordinates(coordinates);
    console.log('📍 Agency coordinates loaded:', coordinates.length);
  };

  // Handle agency selection from map or list
  const handleAgencySelection = async (agency) => {
    if (agency.id !== selectedAgencyId) {
      // Check if cart has items from different agency and show confirmation modal
      if (cartItems.length > 0 && cartSelectedAgency && cartSelectedAgency !== agency.id) {
        setPendingAgencySelection(agency);
        setIsCartClearModalVisible(true);
        return;
      }
      
      await selectAgency(agency);
      // Navigate back to products screen with selected agency
      navigation.goBack();
    } else {
      // If same agency is already selected, just go back
      navigation.goBack();
    }
  };

  // Handle cart clear confirmation
  const handleCartClearConfirmation = async () => {
    if (pendingAgencySelection) {
      console.log('🛒 User confirmed: Clearing cart due to agency change');
      dispatch(clearCart());
      await selectAgency(pendingAgencySelection);
      setIsCartClearModalVisible(false);
      setPendingAgencySelection(null);
      navigation.goBack();
    }
  };

  // Handle cart clear cancellation
  const handleCartClearCancellation = () => {
    setIsCartClearModalVisible(false);
    setPendingAgencySelection(null);
  };

  // Handle agency marker press on map
  const handleAgencyMarkerPress = (agency) => {
    setSelectedAgencyForModal(agency);
    setIsAgencyDetailsModalVisible(true);
  };

  // Render agency tabs (List/Map)
  const renderAgencyTabs = () => (
    <View style={styles.agencyTabsContainer}>
      <TouchableOpacity
        style={[
          styles.agencyTab,
          activeTab === 'list' && styles.agencyTabActive,
        ]}
        onPress={() => setActiveTab('list')}>
        <Icon 
          name="list" 
          size={20} 
          color={activeTab === 'list' ? COLORS.white : COLORS.textSecondary} 
        />
        <Text
          style={[
            styles.agencyTabText,
            activeTab === 'list' && styles.agencyTabTextActive,
          ]}>
          List
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.agencyTab,
          activeTab === 'map' && styles.agencyTabActive,
        ]}
        onPress={() => setActiveTab('map')}>
        <Icon 
          name="map" 
          size={20} 
          color={activeTab === 'map' ? COLORS.white : COLORS.textSecondary} 
        />
        <Text
          style={[
            styles.agencyTabText,
            activeTab === 'map' && styles.agencyTabTextActive,
          ]}>
          Map
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render map view with agencies
  const renderMapView = () => {
    if (!customerLocation) {
      return (
        <View style={styles.mapLoadingContainer}>
          <View style={styles.loadingContent}>
            <Icon name="my-location" size={40} color={COLORS.primary} />
            <Text style={styles.mapLoadingText}>Getting your location...</Text>
            <Text style={styles.mapLoadingSubtext}>This may take a few seconds</Text>
          </View>
        </View>
      );
    }

    if (agencyCoordinates.length === 0) {
      return (
        <View style={styles.mapLoadingContainer}>
          <View style={styles.loadingContent}>
            <Icon name="store" size={40} color={COLORS.primary} />
            <Text style={styles.mapLoadingText}>Loading agency locations...</Text>
            <Text style={styles.mapLoadingSubtext}>Finding nearby agencies</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={customerLocation}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="standard">
          
          {/* Customer location marker */}
          <Marker
            coordinate={{
              latitude: customerLocation.latitude,
              longitude: customerLocation.longitude,
            }}
            title="Your Location"
            description="Current location"
            pinColor="blue">
            <View style={styles.customerMarker}>
              <Icon name="person" size={20} color={COLORS.white} />
            </View>
          </Marker>
          
          {/* Agency markers with real coordinates */}
          {agencyCoordinates.map(agency => (
            <Marker
              key={agency.id}
              coordinate={{
                latitude: agency.latitude,
                longitude: agency.longitude,
              }}
              title={agency.name}
              description={`${agency.address}, ${agency.city} - ${agency.pincode}`}
              onPress={() => handleAgencyMarkerPress(agency)}>
              <View style={[
                styles.agencyMarker,
                agency.id === selectedAgencyId && styles.agencyMarkerSelected
              ]}>
                <Icon name="store" size={20} color={COLORS.white} />
                <Text style={styles.agencyMarkerText}>{agency.name}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>
    );
  };

  // Render agency list
  const renderAgencyList = () => (
    <ScrollView 
      style={styles.agencyList}
      showsVerticalScrollIndicator={true}
      bounces={true}
      scrollEnabled={true}>
      {agencies.map(agency => (
        <TouchableOpacity
          key={agency.id}
          style={[
            styles.agencyCard,
            agency.id === selectedAgencyId && styles.agencyCardSelected
          ]}
          onPress={() => handleAgencySelection(agency)}>
          <View style={styles.agencyCardContent}>
            {/* Agency Image - Full Width */}
            <View style={styles.agencyImageContainerFull}>
              {agency.profileImage ? (
                <Image
                  source={{uri: agency.profileImage}}
                  style={styles.agencyImageFull}
                />
              ) : (
                <View style={[styles.agencyImageFull, styles.agencyImagePlaceholder]}>
                  <Text style={styles.agencyInitialText}>
                    {agency.name ? agency.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Agency Details - Below Image */}
            <View style={styles.agencyDetailsFull}>
              <View style={styles.agencyNameContainerFull}>
                <Text style={[
                  styles.agencyNameFull,
                  agency.id === selectedAgencyId && styles.agencyNameSelected
                ]} numberOfLines={1}>
                  {agency.name}
                </Text>
                {agency.id === selectedAgencyId && (
                  <View style={styles.selectedBadge}>
                    <Icon name="check-circle" size={20} color={COLORS.primary} />
                  </View>
                )}
              </View>
              
              {/* Contact Info */}
              {agency.phone && (
                <View style={styles.agencyInfoRowCompact}>
                  <Icon name="phone" size={14} color={COLORS.primary} />
                  <Text style={styles.agencyInfoTextCompact} numberOfLines={1}>
                    {agency.phone}
                  </Text>
                </View>
              )}
              
              {agency.email && (
                <View style={styles.agencyInfoRowCompact}>
                  <Icon name="email" size={14} color={COLORS.primary} />
                  <Text style={styles.agencyInfoTextCompact} numberOfLines={1}>
                    {agency.email}
                  </Text>
                </View>
              )}
              
              {/* Address Info */}
              <View style={styles.agencyInfoRowCompact}>
                <Icon name="place" size={14} color={COLORS.textSecondary} />
                <Text style={styles.agencyInfoTextCompact} numberOfLines={2}>
                  {agency.address}, {agency.city} - {agency.pincode}
                </Text>
              </View>
              
              {agency.landmark && (
                <View style={styles.agencyInfoRowCompact}>
                  <Icon name="pin-drop" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.agencyInfoTextCompact} numberOfLines={1}>
                    Near: {agency.landmark}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Agency</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Agency Tabs */}
      {renderAgencyTabs()}
      
      {/* Content */}
      {agencies.length > 0 ? (
        activeTab === 'list' ? (
          renderAgencyList()
        ) : (
          renderMapView()
        )
      ) : (
        <View style={styles.emptyAgencyState}>
          <Text style={styles.emptyAgencyText}>
            {isLoadingAgencies ? 'Loading agencies...' : 'No agencies available'}
          </Text>
        </View>
      )}

      {/* Agency Details Modal */}
      <Modal
        visible={isAgencyDetailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAgencyDetailsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.agencyDetailsModalContent}>
            {selectedAgencyForModal && (
              <>
                <View style={styles.agencyDetailsModalHeader}>
                  <Text style={styles.agencyDetailsModalTitle}>
                    {selectedAgencyForModal.name}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setIsAgencyDetailsModalVisible(false)}
                    style={styles.closeButton}>
                    <Icon name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.agencyDetailsContent}>
                  {/* Agency Image */}
                  <View style={styles.agencyDetailsImageContainer}>
                    {selectedAgencyForModal.profileImage ? (
                      <Image
                        source={{uri: selectedAgencyForModal.profileImage}}
                        style={styles.agencyDetailsImage}
                      />
                    ) : (
                      <View style={[styles.agencyDetailsImage, styles.agencyDetailsImagePlaceholder]}>
                        <Text style={styles.agencyDetailsInitialText}>
                          {selectedAgencyForModal.name ? selectedAgencyForModal.name.charAt(0).toUpperCase() : '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Contact Information */}
                  <View style={styles.contactSection}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    
                    {selectedAgencyForModal.phone && (
                      <View style={styles.contactRow}>
                        <Icon name="phone" size={20} color={COLORS.primary} />
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactLabel}>Phone</Text>
                          <Text style={styles.contactValue}>{selectedAgencyForModal.phone}</Text>
                        </View>
                      </View>
                    )}
                    
                    {selectedAgencyForModal.email && (
                      <View style={styles.contactRow}>
                        <Icon name="email" size={20} color={COLORS.primary} />
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactLabel}>Email</Text>
                          <Text style={styles.contactValue}>{selectedAgencyForModal.email}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  
                  {/* Address Information */}
                  <View style={styles.addressSection}>
                    <Text style={styles.sectionTitle}>Address</Text>
                    <View style={styles.addressRow}>
                      <Icon name="place" size={20} color={COLORS.textSecondary} />
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressText}>
                          {selectedAgencyForModal.address}
                        </Text>
                        <Text style={styles.addressText}>
                          {selectedAgencyForModal.city} - {selectedAgencyForModal.pincode}
                        </Text>
                        {selectedAgencyForModal.landmark && (
                          <Text style={styles.landmarkText}>
                            Near: {selectedAgencyForModal.landmark}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </ScrollView>
                
                <View style={styles.agencyDetailsModalFooter}>
                  <TouchableOpacity
                    style={styles.selectAgencyButton}
                    onPress={() => {
                      setIsAgencyDetailsModalVisible(false);
                      handleAgencySelection(selectedAgencyForModal);
                    }}>
                    <Icon name="check" size={20} color={COLORS.white} />
                    <Text style={styles.selectAgencyButtonText}>Select This Agency</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Cart Clear Confirmation Modal */}
      <Modal
        visible={isCartClearModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCartClearCancellation}>
        <View style={styles.cartClearModalOverlay}>
          <View style={styles.cartClearModalContent}>
            {/* Modal Header */}
            <View style={styles.cartClearModalHeader}>
              <View style={styles.cartClearIconContainer}>
                <Icon name="shopping-cart" size={32} color={COLORS.error} />
              </View>
              <Text style={styles.cartClearModalTitle}>Clear Cart?</Text>
              <TouchableOpacity 
                onPress={handleCartClearCancellation}
                style={styles.cartClearCloseButton}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Modal Body */}
            <View style={styles.cartClearModalBody}>
              <Text style={styles.cartClearModalMessage}>
                You have <Text style={styles.cartClearHighlight}>{cartItems.length} item(s)</Text> in your cart from a different agency.
              </Text>
              <Text style={styles.cartClearModalSubMessage}>
                Changing agency will clear your current cart. You can add items from the new agency.
              </Text>
              
              {/* Cart Items Preview */}
              <View style={styles.cartItemsPreview}>
                <Text style={styles.cartItemsPreviewTitle}>Current Cart Items:</Text>
                {cartItems.slice(0, 3).map((item, index) => (
                  <View key={index} style={styles.cartItemPreview}>
                    <Icon name="radio-button-unchecked" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.cartItemPreviewText} numberOfLines={1}>
                      {item.productName} x {item.quantity}
                    </Text>
                  </View>
                ))}
                {cartItems.length > 3 && (
                  <Text style={styles.cartItemsMoreText}>
                    +{cartItems.length - 3} more items
                  </Text>
                )}
              </View>
            </View>
            
            {/* Modal Footer */}
            <View style={styles.cartClearModalFooter}>
              <TouchableOpacity
                style={styles.cartClearCancelButton}
                onPress={handleCartClearCancellation}>
                <Text style={styles.cartClearCancelButtonText}>Keep Current Agency</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cartClearConfirmButton}
                onPress={handleCartClearConfirmation}>
                <Icon name="check" size={20} color={COLORS.white} />
                <Text style={styles.cartClearConfirmButtonText}>Clear Cart & Continue</Text>
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
    backgroundColor: COLORS.primary,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: wp('5%'),
    borderBottomRightRadius: wp('5%'),
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    padding: wp('2%'),
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 40, // To balance the back button
  },
  agencyTabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
    padding: wp('1%'),
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  agencyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  agencyTabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  agencyTabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  agencyTabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  agencyList: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  agencyCard: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  agencyCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    backgroundColor: COLORS.subtle,
  },
  agencyCardContent: {
    padding: 0,
  },
  agencyImageContainerFull: {
    height: hp('15%'),
    backgroundColor: COLORS.background,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  agencyImageFull: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  agencyImagePlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agencyInitialText: {
    fontSize: fontSize.xxl * 1.5,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  agencyDetailsFull: {
    padding: spacing.md,
  },
  agencyNameContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  agencyNameFull: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  selectedBadge: {
    backgroundColor: COLORS.subtle,
    borderRadius: 15,
    padding: 4,
  },
  agencyInfoRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 1,
  },
  agencyInfoTextCompact: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: fontSize.sm,
  },
  agencyNameSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  emptyAgencyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyAgencyText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    height: hp('60%'),
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: hp('60%'),
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: COLORS.background,
    borderRadius: borderRadius.md,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: {
    fontSize: fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  mapLoadingSubtext: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  customerMarker: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  agencyMarker: {
    backgroundColor: COLORS.secondary,
    borderRadius: 15,
    padding: 6,
    paddingHorizontal: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  agencyMarkerSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  agencyMarkerText: {
    color: COLORS.white,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  agencyDetailsModalContent: {
    backgroundColor: COLORS.white,
    width: wp('90%'),
    height: hp('70%'),
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  agencyDetailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.primary,
  },
  agencyDetailsModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
  },
  closeButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  agencyDetailsContent: {
    flex: 1,
    padding: spacing.md,
  },
  agencyDetailsImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  agencyDetailsImage: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    resizeMode: 'cover',
  },
  agencyDetailsImagePlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agencyDetailsInitialText: {
    fontSize: fontSize.xxl * 2,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  contactSection: {
    marginBottom: spacing.lg,
  },
  addressSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  contactInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  contactLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  addressInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  addressText: {
    fontSize: fontSize.md,
    color: COLORS.textPrimary,
    lineHeight: fontSize.lg,
    marginBottom: 2,
  },
  landmarkText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  agencyDetailsModalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  selectAgencyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    gap: spacing.sm,
  },
  selectAgencyButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  // Cart Clear Modal Styles
  cartClearModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    elevation: 20,
  },
  cartClearModalContent: {
    backgroundColor: COLORS.white,
    width: wp('90%'),
    maxHeight: hp('60%'),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 25,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cartClearModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartClearIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cartClearModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  cartClearCloseButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  cartClearModalBody: {
    padding: spacing.md,
  },
  cartClearModalMessage: {
    fontSize: fontSize.md,
    color: COLORS.textPrimary,
    lineHeight: fontSize.lg,
    marginBottom: spacing.sm,
  },
  cartClearHighlight: {
    color: COLORS.error,
    fontWeight: '700',
  },
  cartClearModalSubMessage: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: fontSize.md,
    marginBottom: spacing.lg,
  },
  cartItemsPreview: {
    backgroundColor: COLORS.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cartItemsPreviewTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: spacing.sm,
  },
  cartItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cartItemPreviewText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  cartItemsMoreText: {
    fontSize: fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  cartClearModalFooter: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: spacing.sm,
  },
  cartClearCancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cartClearCancelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  cartClearConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    gap: spacing.xs,
    minHeight: 44,
  },
  cartClearConfirmButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default AgencySelectionScreen;
