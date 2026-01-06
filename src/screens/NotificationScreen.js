import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../constants';
import apiClient from '../utils/apiConfig';

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
  const insets = useSafeAreaInsets();

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

      navigation.navigate('Orders');
      console.log('changedfdf');
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (error) {
      console.log('markAsRead error', error);
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
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
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
            <NotificationItem item={item} onPress={() => markAsRead(item)} />
          )}
          contentContainerStyle={{paddingBottom: 20}}
          showsVerticalScrollIndicator={false}
           ListEmptyComponent={!loading ? <EmptyNotification /> : null}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
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
