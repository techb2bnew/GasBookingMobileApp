import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// Import MapView with fallback for when react-native-maps is not installed
let MapView, Marker, PROVIDER_GOOGLE;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (error) {
  console.log('react-native-maps not installed, using placeholder');
  MapView = null;
  Marker = null;
  PROVIDER_GOOGLE = null;
}
import { COLORS } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { requestLocationPermission, getCurrentLocation } from '../utils/locationPermissions';
import { testGeolocation, testLocationPermission } from '../utils/locationTest';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MapPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [currentLocation, setCurrentLocation] = useState(null);
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Auto-get current location when component mounts
  useEffect(() => {
    getCurrentLocationOnMount();
  }, []);

  // Update map region when current location changes
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      // Animate map to current location
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation]);

  const getCurrentLocationOnMount = async () => {
    try {
      console.log('Starting location detection...');
      
      // Run tests first
      const geolocationTest = testGeolocation();
      const permissionTest = await testLocationPermission();
      
      console.log('Geolocation test result:', geolocationTest);
      console.log('Permission test result:', permissionTest);
      
      const hasPermission = await requestLocationPermission();
      console.log('Permission result:', hasPermission);
      
      if (hasPermission) {
        console.log('Getting current location...');
        
        try {
          const location = await getCurrentLocation();
          console.log('Location obtained:', location);
          
          const address = await getAddressFromCoordinates(location.latitude, location.longitude);
          console.log('Address obtained:', address);
          
          const currentLocationData = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: address
          };
          console.log("currentLocationData", currentLocationData);
          
          setCurrentLocation(currentLocationData);
          
          // If no initial location is set, use current location as selected
          if (!initialLocation) {
            setSelectedLocation(currentLocationData);
          }
        } catch (locationError) {
          console.log('Location error, using fallback location:', locationError);
          
          // Use a fallback location for testing
          const fallbackLocation = {
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Connaught Place, New Delhi, India'
          };
          
          console.log('Using fallback location:', fallbackLocation);
          setCurrentLocation(fallbackLocation);
          
          if (!initialLocation) {
            setSelectedLocation(fallbackLocation);
          }
        }
      } else {
        console.log('Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location permission in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Auto location error:', error);
      console.log('Error details:', error.message);
      
      // Show a helpful message if geolocation library is missing
      if (error.message.includes('Geolocation library not installed')) {
        Alert.alert(
          'Location Library Missing',
          'Please install @react-native-community/geolocation to use location features. For now, you can manually select a location on the map.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Location Error',
          `Failed to get location: ${error.message}. Please check your GPS and try again.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const MapComponent = () => {
    if (!MapView) {
      // Fallback when react-native-maps is not installed
      return (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Icon name="map" size={60} color={COLORS.lightGray} />
            <Text style={styles.mapText}>Map Component</Text>
            <Text style={styles.mapSubtext}>Please install react-native-maps</Text>
          </View>
        </View>
      );
    }

    // Only show map if current location is available
    if (!currentLocation) {
      return (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Icon name="location-off" size={60} color={COLORS.lightGray} />
            <Text style={styles.mapText}>Getting Your Location...</Text>
            <Text style={styles.mapSubtext}>Please wait while we detect your current location</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={getCurrentLocationOnMount}>
              <Text style={styles.retryButtonText}>Retry Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          // provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          zoomEnabled={true}
          scrollEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}>
          
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
              description={selectedLocation.address}
              pinColor={COLORS.primary}
            />
          )}
          
          <Marker
            coordinate={currentLocation}
            title="Current Location"
            description="Your current location"
            pincolor={COLORS.blue}
          />
        </MapView>
      </View>
    );
  };





  const handleMapPress = async (coordinate) => {
    try {
      // Convert coordinates to address using reverse geocoding
      const address = await getAddressFromCoordinates(coordinate.latitude, coordinate.longitude);
      
      const newLocation = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address
      };
      
      setSelectedLocation(newLocation);
    } catch (error) {
      console.log('Reverse geocoding error:', error);
      // Fallback to coordinates if geocoding fails
      const fallbackAddress = `Location at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`;
      const newLocation = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: fallbackAddress
      };
      setSelectedLocation(newLocation);
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBXNyT9zcGdvhAUCUEYTm6e_qPw26AOPgI`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        return `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    } catch (error) {
      console.log('Geocoding API error:', error);
      return `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  const parseAddressComponents = (address) => {
    const components = {
      title: 'Home',
      address: address,
      city: '',
      pincode: '',
      landmark: ''
    };

    try {
      // Extract pincode (6 digits)
      const pincodeMatch = address.match(/\b\d{6}\b/);
      if (pincodeMatch) {
        components.pincode = pincodeMatch[0];
      }

      // Extract city (common Indian cities)
      const cities = [
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 
        'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
        'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
        'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
        'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
        'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad',
        'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada',
        'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh',
        'Solapur', 'Hubli-Dharwad', 'Bareilly', 'Moradabad', 'Mysore', 'Gurgaon',
        'Aligarh', 'Jalandhar', 'Tiruchirappalli', 'Bhubaneswar', 'Salem', 'Warangal',
        'Mira-Bhayandar', 'Thiruvananthapuram', 'Bhiwandi', 'Saharanpur', 'Guntur',
        'Amravati', 'Bikaner', 'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack',
        'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur',
        'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola',
        'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi',
        'Ulhasnagar', 'Jammu', 'Sangli-Miraj', 'Mangalore', 'Erode', 'Belgaum',
        'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur',
        'Maheshtala', 'Tirupur', 'Davanagere', 'Kozhikode', 'Akron', 'Kurnool',
        'Rajpur Sonarpur', 'Bokaro', 'South Dumdum', 'Bellary', 'Patiala',
        'Gopalpur', 'Agartala', 'Bhagalpur', 'Muzaffarnagar', 'Bhatpara',
        'Panihati', 'Latur', 'Dhule', 'Rohtak', 'Korba', 'Bhilwara',
        'Berhampur', 'Muzaffarpur', 'Ahmednagar', 'Mathura', 'Kollam',
        'Avadi', 'Kadapa', 'Kamarhati', 'Bilaspur', 'Shahjahanpur',
        'Satara', 'Bijapur', 'Rampur', 'Shivamogga', 'Chandrapur',
        'Junagadh', 'Thrissur', 'Alwar', 'Bardhaman', 'Kulti', 'Kakinada',
        'Nizamabad', 'Parbhani', 'Tumkur', 'Hisar', 'Ozhukarai', 'Bihar Sharif',
        'Panipat', 'Darbhanga', 'Bally', 'Aizawl', 'Dewas', 'Ichalkaranji',
        'Tirupati', 'Karnal', 'Bathinda', 'Rampur', 'Shivpuri', 'Ratlam',
        'Modinagar', 'Delhi Cantonment', 'Pali', 'Ramagundam', 'Silchar',
        'Haridwar', 'Vijayanagaram', 'Katihar', 'Nagercoil', 'Sri Ganganagar',
        'Karawal Nagar', 'Mango', 'Thane', 'Dombivli', 'Navi Mumbai',
        'Kalyan', 'Thakurganj', 'Gorakhpur', 'Bareilly', 'Moradabad',
        'Aligarh', 'Meerut', 'Ghaziabad', 'Noida', 'Greater Noida',
        'Faridabad', 'Gurgaon', 'Sonipat', 'Panipat', 'Karnal', 'Rohtak',
        'Hisar', 'Bhiwani', 'Sirsa', 'Fatehabad', 'Jind', 'Kaithal',
        'Kurukshetra', 'Yamunanagar', 'Ambala', 'Panchkula', 'Mohali',
        'Chandigarh', 'Patiala', 'Ludhiana', 'Amritsar', 'Jalandhar',
        'Kapurthala', 'Hoshiarpur', 'Gurdaspur', 'Pathankot', 'Moga',
        'Firozpur', 'Faridkot', 'Muktsar', 'Bathinda', 'Sangrur', 'Barnala',
        'Mansa', 'Fazilka', 'Tarn Taran', 'Ajitgarh', 'SAS Nagar','Sahibzada Ajit Singh Nagar'
      ];

      for (const city of cities) {
        if (address.includes(city)) {
          components.city = city;
          break;
        }
      }

      // Generate title based on city or area
      if (components.city) {
        components.title = `${components.city} Address`;
      } else {
        components.title = 'Home';
      }

    } catch (error) {
      console.log('Address parsing error:', error);
    }

    return components;
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      // Set current location as selected location
      setSelectedLocation(currentLocation);
      
      // Parse address components
      const addressComponents = parseAddressComponents(currentLocation.address);
      
      // Create location object with parsed components
      const locationWithComponents = {
        ...currentLocation,
        ...addressComponents
      };
      
      // Automatically confirm and return the location
      onLocationSelect(locationWithComponents);
      
    } else {
      Alert.alert('Error', 'Current location not available. Please try again.');
    }
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      // Parse address components
      const addressComponents = parseAddressComponents(selectedLocation.address);
      
      // Create location object with parsed components
      const locationWithComponents = {
        ...selectedLocation,
        ...addressComponents
      };
      
      onLocationSelect(locationWithComponents);
      // Alert.alert('Success', 'Location confirmed and address form will be auto-filled');
    } else {
      Alert.alert('Error', 'Please select a location first');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
          <Text style={styles.title}>Select Location</Text>
          <Text style={styles.subtitle}>
            {currentLocation 
              ? "Your current location is shown. Tap anywhere on the map to pick a different location, then confirm."
              : "Please wait while we get your current location..."
            }
          </Text>
        </View>

        <MapComponent />

        {currentLocation && (
          <View style={styles.locationInfo}>
            {selectedLocation && (
              <View style={styles.selectedLocationInfo}>
                <Icon name="location-on" size={20} color={COLORS.primary} />
                <Text style={styles.locationText}>{selectedLocation.address}</Text>
              </View>
            )}
          </View>
        )}

        {currentLocation && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.currentLocationButton]}
              onPress={useCurrentLocation}>
              <Icon name="my-location" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Use Current Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={confirmLocation}>
              <Icon name="check" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Confirm Selected Location</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to use:</Text>
          {currentLocation ? (
            <>
              <View style={styles.instructionItem}>
                <Icon name="radio-button-checked" size={16} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  Click "Use Current Location" to automatically fill address form
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="radio-button-checked" size={16} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  Or tap anywhere on the map to pick a different location
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="radio-button-checked" size={16} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  Then confirm the selected location to auto-fill the form
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.instructionItem}>
                <Icon name="radio-button-checked" size={16} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  Please enable location permission to use this feature
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="radio-button-checked" size={16} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  Make sure GPS is enabled on your device
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="radio-button-checked" size={16} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  The map will appear once your location is detected
                </Text>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
    margin: 15,
    // iOS specific styling to ensure map respects safe area
    ...(Platform.OS === 'ios' && {
      marginTop: 0,
      marginBottom: 0,
    }),
  },
  map: {
    flex: 1,
    borderRadius: 12,
    // iOS specific styling for map
    ...(Platform.OS === 'ios' && {
      overflow: 'hidden',
    }),
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  mapSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.highlight,
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentLocationButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructions: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
});

export default MapPicker;
