import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, SafeAreaView } from 'react-native';

import { store, persistor } from './src/redux/store';
import { AppNavigator } from './src/navigation';
import { COLORS } from './src/constants';
import { requestLocationPermission } from './src/utils/locationPermissions';

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const App = () => {
  useEffect(() => {
    // Request location permission when app starts
    requestLocationPermission();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <AppNavigator />
          </SafeAreaView>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.text,
  },
});

export default App;

