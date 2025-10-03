import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../contexts/SocketContext';
import { 
  useOrderEvents, 
  useForceLogout, 
  useOrderRoom,
  useConnectionStatus 
} from '../hooks/useSocketEvents';
import { COLORS } from '../constants';

const SocketUsageExample = () => {
  const dispatch = useDispatch();
  const { orders } = useSelector(state => state.orders);
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { socket, isConnected, emit } = useSocket();
  
  const [notifications, setNotifications] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Get connection status
  const { 
    isConnected: socketConnected, 
    socketId, 
    connectionError 
  } = useConnectionStatus();

  // Setup order events with callbacks
  useOrderEvents({
    onOrderCreated: (orderData) => {
      console.log('📦 New order received:', orderData);
      addNotification(`New order: ${orderData.orderNumber}`, 'success');
    },
    onOrderStatusUpdated: (orderData) => {
      console.log('📋 Order status updated:', orderData);
      addNotification(`Order ${orderData.orderNumber}: ${orderData.status}`, 'info');
    },
    onOrderAssigned: (orderData) => {
      console.log('👨‍💼 Order assigned:', orderData);
      addNotification(`Order ${orderData.orderNumber} assigned to ${orderData.agentName}`, 'info');
    },
    onOrderDelivered: (orderData) => {
      console.log('✅ Order delivered:', orderData);
      addNotification(`Order ${orderData.orderNumber} delivered successfully!`, 'success');
    }
  });

  // Handle force logout
  useForceLogout((data) => {
    console.log('🚫 Force logout in component:', data);
    Alert.alert(
      'Session Ended',
      data.data.message,
      [{ text: 'OK', onPress: () => console.log('User acknowledged force logout') }]
    );
  });

  // Join order room for real-time tracking
  useOrderRoom(selectedOrderId);

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only 10 notifications
  };

  // Manual socket event emitters (examples)
  const testSocketEmit = () => {
    if (socket && isConnected) {
      emit('test-event', { 
        message: 'Hello from React Native!',
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      addNotification('Test event sent to server', 'info');
    } else {
      Alert.alert('Error', 'Socket not connected');
    }
  };

  const joinSpecificOrderRoom = (orderId) => {
    if (socket && isConnected) {
      emit('join-order', { orderId });
      setSelectedOrderId(orderId);
      addNotification(`Joined order room: ${orderId}`, 'info');
    }
  };

  const leaveOrderRoom = () => {
    if (socket && isConnected && selectedOrderId) {
      emit('leave-order', { orderId: selectedOrderId });
      setSelectedOrderId(null);
      addNotification('Left order room', 'info');
    }
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.orderItem,
        selectedOrderId === item.orderId && styles.selectedOrder
      ]}
      onPress={() => joinSpecificOrderRoom(item.orderId)}
    >
      <Text style={styles.orderNumber}>Order: {item.orderNumber}</Text>
      <Text style={styles.orderStatus}>Status: {item.status}</Text>
      <Text style={styles.orderAmount}>Amount: ₹{item.totalAmount}</Text>
      {item.agentName && (
        <Text style={styles.agentName}>Agent: {item.agentName}</Text>
      )}
    </TouchableOpacity>
  );

  const renderNotification = ({ item }) => (
    <View style={[styles.notification, styles[item.type]]}>
      <Text style={styles.notificationText}>{item.message}</Text>
      <Text style={styles.notificationTime}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: socketConnected ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>
          Socket: {socketConnected ? 'Connected' : 'Disconnected'}
          {socketId && ` (${socketId})`}
        </Text>
      </View>

      {connectionError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {connectionError}</Text>
        </View>
      )}

      {/* Test Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testSocketEmit}>
          <Text style={styles.buttonText}>Test Socket Emit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={leaveOrderRoom} disabled={!selectedOrderId}>
          <Text style={[styles.buttonText, !selectedOrderId && styles.disabledText]}>
            Leave Order Room
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Order Room */}
      {selectedOrderId && (
        <View style={styles.currentRoomContainer}>
          <Text style={styles.currentRoomText}>
            📍 Tracking Order: {selectedOrderId}
          </Text>
        </View>
      )}

      {/* Orders List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders (Tap to join room)</Text>
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.orderId || item.id}
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Real-time Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Real-time Notifications</Text>
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          style={styles.notificationsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#f5f5f5',
    padding: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.primary || '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.5,
  },
  currentRoomContainer: {
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 16,
  },
  currentRoomText: {
    color: '#1976D2',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  ordersList: {
    maxHeight: 200,
  },
  orderItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  selectedOrder: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  orderAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  agentName: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 2,
    fontStyle: 'italic',
  },
  notificationsList: {
    maxHeight: 200,
  },
  notification: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  success: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  info: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  warning: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  error: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default SocketUsageExample;
