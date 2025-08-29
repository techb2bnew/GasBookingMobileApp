# React Native Maps Setup Guide

## Installation Steps

### 1. Install Dependencies
```bash
npm install react-native-maps @react-native-community/geolocation react-native-permissions --legacy-peer-deps
```

### 2. iOS Setup

#### Add to iOS/Podfile
```ruby
pod 'react-native-maps', :path => '../node_modules/react-native-maps'
pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'
```

#### Run pod install
```bash
cd ios && pod install && cd ..
```

#### Add to iOS/Info.plist
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location to show your delivery address on map.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to location to show your delivery address on map.</string>
```

### 3. Android Setup

#### Add to android/app/build.gradle
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-maps:18.1.0'
    implementation 'com.google.android.gms:play-services-location:21.0.1'
}
```

#### Add to android/app/src/main/AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<application>
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
</application>
```

#### Add to android/settings.gradle
```gradle
include ':react-native-maps'
project(':react-native-maps').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-maps/lib/android')
```

#### Add to android/app/src/main/java/com/gasbooking/MainApplication.java
```java
import com.airbnb.android.react.maps.MapsPackage;

@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new MapsPackage()
    );
}
```

### 4. Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Maps SDK for Android and iOS
4. Create API key
5. Add restrictions (Android package name, iOS bundle ID)
6. Replace `YOUR_GOOGLE_MAPS_API_KEY` in AndroidManifest.xml

### 5. Update Components

#### Replace MapPicker.js MapComponent with:
```javascript
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const MapComponent = () => (
  <MapView
    provider={PROVIDER_GOOGLE}
    style={styles.map}
    initialRegion={{
      latitude: 28.6139,
      longitude: 77.2090,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }}
    onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}>
    {selectedLocation && (
      <Marker
        coordinate={selectedLocation}
        title="Selected Location"
        description={selectedLocation.address}
      />
    )}
  </MapView>
);
```

#### Replace TrackingScreen.js mapPlaceholder with:
```javascript
<MapView
  provider={PROVIDER_GOOGLE}
  style={styles.map}
  initialRegion={{
    latitude: trackingData.currentLocation.latitude,
    longitude: trackingData.currentLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}>
  <Marker
    coordinate={trackingData.currentLocation}
    title="Delivery Location"
    description={trackingData.currentLocation.address}
  />
</MapView>
```

### 6. Location Permissions

#### Add to App.js or index.js:
```javascript
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';

const requestLocationPermission = async () => {
  try {
    const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    if (result === RESULTS.GRANTED) {
      console.log('Location permission granted');
    }
  } catch (error) {
    console.log('Permission request error:', error);
  }
};

// Call this in useEffect
useEffect(() => {
  requestLocationPermission();
}, []);
```

### 7. Build and Test

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## Features Implemented

1. **MapPicker Component**: For selecting delivery address
2. **TrackingScreen**: For order tracking with map
3. **Location Permissions**: Request and handle location access
4. **Current Location**: Get user's GPS location
5. **Map Integration**: Google Maps for both platforms

## Notes

- Replace placeholder map components with actual MapView
- Add proper error handling for location services
- Test on both iOS and Android devices
- Ensure Google Maps API key is properly configured
- Handle location permission denials gracefully
