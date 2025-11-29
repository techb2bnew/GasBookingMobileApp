# Geolocation Setup Guide

## Install Missing Dependency

The app needs the React Native Geolocation library to get your current location.

### Install the library:

```bash
npm install @react-native-community/geolocation --legacy-peer-deps
```

### For iOS, also run:
```bash
cd ios && pod install && cd ..
```

### For Android, no additional setup needed.

## What this fixes:

- ✅ **"Geolocation is not supported"** error
- ✅ **Current location detection** on map open
- ✅ **GPS coordinates** from device
- ✅ **Location permissions** handling

## After installation:

1. **Restart the app** completely
2. **Grant location permission** when prompted
3. **Map will show** your current location automatically
4. **"Use Current Location"** button will work

## Features that will work:

- ✅ **Auto-detect current location** when map opens
- ✅ **Manual current location** button
- ✅ **GPS coordinates** to address conversion
- ✅ **Real-time location** updates

## If you still have issues:

1. **Check GPS** is enabled on your device
2. **Grant location permission** in app settings
3. **Restart the app** after installation
4. **Test on physical device** (not simulator)

## Manual Location Selection:

Even without the library, you can still:
- ✅ **Tap on map** to select location
- ✅ **Use Google Maps** integration
- ✅ **Get addresses** from coordinates
- ✅ **Save locations** manually
