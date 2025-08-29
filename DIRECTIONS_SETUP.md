# React Native Maps Directions Setup

## Installation

```bash
npm install react-native-maps-directions
```

## Google Maps API Key Setup

1. **Enable Directions API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to "APIs & Services" > "Library"
   - Search for "Directions API"
   - Click "Enable"

2. **Get API Key:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

3. **Update the Code:**
   - Replace `"YOUR_GOOGLE_MAPS_API_KEY"` in `src/screens/TrackingScreen.js`
   - Use your actual Google Maps API key

## Features

- **Real-time directions** from pickup to destination
- **Waypoint support** for current driver location
- **Optimized routes** using Google's routing algorithm
- **Multiple transport modes** (DRIVING, WALKING, BICYCLING, TRANSIT)

## Usage

The directions will automatically show:
- **Pickup location** → **Current driver location** → **Delivery destination**
- **Real-time route** with traffic considerations
- **Estimated travel time** and distance

## Error Handling

- If directions API is not available, no route line will be shown
- Check console logs for any API errors
- Ensure API key has proper permissions and billing is enabled
