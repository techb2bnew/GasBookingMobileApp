import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../constants';
import apiClient from '../utils/apiConfig';
import { fontSize, spacing, wp } from '../utils/dimensions';

const NotificationItem = ({item, onPress}) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={item.isRead ? 'notifications-outline' : 'notifications'}
          size={22}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );
};

const NotificationScreen = ({navigation}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  };

  // GET /api/notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/notifications');
      console.log('responseresponse', response);

      setNotifications(response?.data?.data?.notifications || []);
    } catch (error) {
      console.log('fetchNotifications error', error);
    } finally {
      setLoading(false);
    }
  };

  // GET /api/notifications/unread-count
  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/api/notifications/unread-count');
      console.log('responseresponse111', response.data?.data?.unreadCount);
      setUnreadCount(response.data?.data?.unreadCount || 0);
    } catch (error) {
      console.log('fetchUnreadCount error', error);
    }
  };

  // PUT /api/notifications/:id/read
  const markAsRead = async notification => {
    // if (notification.read) return;

    try {
      await apiClient.put(`/api/notifications/${notification.id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? {...n, read: true} : n)),
      );
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (error) {
      console.log('markAsRead error', error);
    }
  };

  const handleNotificationPress = notification => {
    // Mark notification as read on the server and locally
    markAsRead(notification);

    // Try to extract order id from different possible keys
    const orderId =
      notification.orderId ||
      notification.order_id ||
      notification.orderNumber ||
      notification.order_number ||
      notification.metadata?.orderId ||
      notification.metadata?.order_id ||
      notification.data?.orderId ||
      notification.data?.order_id;

    if (orderId) {
      // Navigate directly to the order details screen using the orderId
      navigation.navigate('OrderDetails', {orderId});
    } else {
      // Fallback: open orders list if no order id is present
      navigation.navigate('Orders');
    }
  };

  // PUT /api/notifications/read-all
  const markAllAsRead = async () => {
    try {
      await apiClient.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({...n, read: true})));
      setUnreadCount(0);
    } catch (error) {
      console.log('markAllAsRead error', error);
    }
  }; const EmptyNotification = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="notifications-off-outline"
          size={64}
          color={COLORS.gray}
        />
        <Text style={styles.emptyTitle}>Notification not found</Text>
        <Text style={styles.emptySubText}>
          You don’t have any notifications right now
        </Text>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
        </Text>

        <TouchableOpacity onPress={markAllAsRead} disabled={unreadCount === 0}>
          <Text style={[styles.clearText, unreadCount === 0 && {opacity: 0.5}]}>
            Read All
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator
          style={{marginTop: 40}}
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <NotificationItem
              item={item}
              onPress={() => handleNotificationPress(item)}
            />
          )}
          contentContainerStyle={{paddingBottom: 20}}
          showsVerticalScrollIndicator={false}
           ListEmptyComponent={!loading ? <EmptyNotification /> : null}
        />
      )}
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + spacing.lg,
    backgroundColor: COLORS.primary,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: fontSize.lg,
      fontWeight: '600',
      color: COLORS.white,
      marginLeft: 10,
      letterSpacing: -0.5,
      marginBottom: wp('0.5%'),
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.CARD,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF4FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: COLORS.SUB_TEXT,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: COLORS.SUB_TEXT,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
    marginLeft: 6,
    marginTop: 6,
  },
  emptyContainer: {
  flex: 1,
  marginVertical:300,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},
emptyTitle: {
  marginTop: 12,
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.blue,
},
emptySubText: {
  marginTop: 6,
  fontSize: 13,
  color: COLORS.textSecondary,
  textAlign: 'center',
},

});
