import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useAgenciesTest } from '../hooks/useAgenciesTest';
import { useSocket } from '../contexts/SocketContext';

const AgencyTestScreen = () => {
  const {
    agencies,
    selectedAgency,
    isLoading,
    error,
    testFetchAgencies,
    testAgencyRemoval,
    testAgencyReactivation,
    hasAgencies,
  } = useAgenciesTest();

  const { isConnected } = useSocket();

  // Fetch agencies on mount
  useEffect(() => {
    testFetchAgencies();
  }, []);

  // Test agency removal
  const handleTestRemoval = () => {
    if (agencies.length > 0) {
      const firstAgency = agencies[0];
      Alert.alert(
        'Test Agency Removal',
        `Remove "${firstAgency.name}" from the list?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            onPress: () => testAgencyRemoval(firstAgency.id)
          }
        ]
      );
    }
  };

  // Test agency reactivation (simulate)
  const handleTestReactivation = () => {
    // Create a mock agency data for testing
    const mockAgency = {
      id: 'test-agency-123',
      name: 'Test Reactivated Agency',
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address',
      city: 'Test City',
      pincode: '123456',
      status: 'active',
      profileImage: null,
      createdAt: new Date().toISOString()
    };

    Alert.alert(
      'Test Agency Reactivation',
      `Add "${mockAgency.name}" back to the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Back', 
          onPress: () => testAgencyReactivation(mockAgency.id, mockAgency)
        }
      ]
    );
  };

  const renderAgencyItem = ({ item }) => (
    <View style={styles.agencyItem}>
      <Text style={styles.agencyName}>{item.name}</Text>
      <Text style={styles.agencyStatus}>Status: {item.status}</Text>
      <Text style={styles.agencyEmail}>{item.email}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agency Real-time Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Socket Connected: {isConnected ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Agencies Count: {agencies.length}
        </Text>
        <Text style={styles.statusText}>
          Loading: {isLoading ? 'Yes' : 'No'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testFetchAgencies}>
          <Text style={styles.buttonText}>Refresh Agencies</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.removeButton]} 
          onPress={handleTestRemoval}
          disabled={!hasAgencies}
        >
          <Text style={styles.buttonText}>
            Test Remove First Agency
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.reactivateButton]} 
          onPress={handleTestReactivation}
        >
          <Text style={styles.buttonText}>
            Test Add Agency Back
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Active Agencies:</Text>
      <FlatList
        data={agencies}
        renderItem={renderAgencyItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  removeButton: {
    backgroundColor: '#f44336',
  },
  reactivateButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  agencyItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  agencyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  agencyStatus: {
    fontSize: 14,
    color: '#4caf50',
    marginBottom: 3,
  },
  agencyEmail: {
    fontSize: 12,
    color: '#666',
  },
});

export default AgencyTestScreen;
