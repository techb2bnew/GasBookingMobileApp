import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'react-native';
// Import MapView with fallback for when react-native-maps is not installed
let MapView, Marker;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (error) {
  console.log('react-native-maps not installed, using placeholder');
  MapView = null;
  Marker = null;
}
import { COLORS } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { requestLocationPermission, getCurrentLocation } from '../utils/locationPermissions';


const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};
const LOCATION_TIMEOUT_MS = 22000; // Slightly more than Geolocation timeout so device GPS gets priority

const MapPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    getCurrentLocationOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation]);

  const getCurrentLocationOnMount = async () => {
    setLocationLoading(true);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Location timeout')), LOCATION_TIMEOUT_MS)
    );

    const runLocationFetch = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocationLoading(false);
        Alert.alert(
          'Location Permission Required',
          'Please enable location permission in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        return null;
      }
      const location = await getCurrentLocation();
      const address = await getAddressFromCoordinates(location.latitude, location.longitude);
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        address,
      };
    };

    try {
      const locationData = await Promise.race([
        runLocationFetch(),
        timeoutPromise,
      ]);
      if (locationData) {
        setCurrentLocation(locationData);
        if (!initialLocation) setSelectedLocation(locationData);
      }
    } catch (err) {
      // Don't set Delhi as fake current location – let user pick on map or retry
      if (err?.message === 'Location timeout') {
        console.log('Location timed out. User can tap map or retry.');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const skipLoadingAndUseMap = () => {
    setLocationLoading(false);
  };

  const mapRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  const mapContent = !MapView ? (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <Icon name="map" size={60} color={COLORS.lightGray} />
        <Text style={styles.mapText}>Map Component</Text>
        <Text style={styles.mapSubtext}>Please install react-native-maps</Text>
      </View>
    </View>
  ) : (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
        onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
        showsUserLocation={!!currentLocation}
        showsMyLocationButton={!!currentLocation}
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
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
            description="Your current location"
            pinColor={COLORS.blue}
          />
        )}
      </MapView>
      {locationLoading && (
        <View style={styles.loadingOverlay} pointerEvents="box-none">
          <View style={styles.loadingCard}>
            <Text style={styles.mapText}>Getting Your Location...</Text>
            <Text style={styles.mapSubtext}>Tap below to pick on map or retry</Text>
            <View style={styles.loadingCardButtons}>
              <TouchableOpacity style={[styles.retryButton, styles.loadingCardButton]} onPress={getCurrentLocationOnMount}>
                <Text style={styles.retryButtonText}>Retry Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.skipButton, styles.loadingCardButton]} onPress={skipLoadingAndUseMap}>
                <Text style={styles.skipButtonText}>Pick on map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );



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
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDAGIK0_mpgKVF-qVgj882DIriSt3vwxqM`
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
      address: address || '',
      city: '',
      pincode: '',
      landmark: ''
    };

    try {
      const addr = (address || '').trim();
      if (!addr) return components;

      // Pincode (6 digits)
      const pincodeMatch = addr.match(/\b\d{6}\b/);
      if (pincodeMatch) components.pincode = pincodeMatch[0];

      // City: first place part from comma-separated address (works for any location)
      // e.g. "Chamba, Himachal Pradesh 176310, India" -> Chamba
      const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
      const placeParts = parts.filter(p => p !== 'India' && !/^\d{6}$/.test(p) && p.length >= 2);
      if (placeParts.length >= 1) components.city = placeParts[0];

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
      <View style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20 }]}>
          <Text style={styles.title}>Select Location</Text>
          <Text style={styles.subtitle}>
            {locationLoading
              ? 'Getting your location… You can tap the map to pick a spot anytime.'
              : currentLocation
                ? 'Tap anywhere on the map to pick a different location, then confirm.'
                : 'Tap on the map to select your location, then confirm.'}
          </Text>
        </View>

        {mapContent}

        {(selectedLocation || currentLocation) && (
          <View style={styles.locationInfo}>
            {selectedLocation && (
              <View style={styles.selectedLocationInfo}>
                <Icon name="location-on" size={20} color={COLORS.primary} />
                <Text style={styles.locationText}>{selectedLocation.address}</Text>
              </View>
            )}
          </View>
        )}

        {(selectedLocation || currentLocation) && (
          <View style={styles.actionButtons}>
            {currentLocation && (
              <TouchableOpacity
                style={[styles.actionButton, styles.currentLocationButton]}
                onPress={useCurrentLocation}>
                <Icon name="my-location" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Use Current Location</Text>
              </TouchableOpacity>
            )}
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
                  Tap on the map to select your location, then confirm
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    minWidth: 260,
  },
  loadingCardButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  loadingCardButton: {
    marginTop: 0,
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
  skipButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  skipButtonText: {
    color: COLORS.primary,
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
