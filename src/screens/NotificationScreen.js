// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   SafeAreaView,
// } from 'react-native';
// import {useSafeAreaInsets} from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/Ionicons';
// import {COLORS} from '../constants';
// import Ionicons from 'react-native-vector-icons/dist/Ionicons';

// const notifications = [
//   {
//     id: '1',
//     title: 'New Order Assigned',
//     message: 'You have received a new order. Please check details.',
//     time: '2 min ago',
//     read: false,
//   },
//   {
//     id: '2',
//     title: 'Payment Successful',
//     message: 'Your last payment was completed successfully.',
//     time: '1 hr ago',
//     read: true,
//   },
//   {
//     id: '3',
//     title: 'Profile Updated',
//     message: 'Your profile information has been updated.',
//     time: 'Yesterday',
//     read: true,
//   },
// ];

// const NotificationItem = ({item}) => {
//   return (
//     <TouchableOpacity style={styles.card} activeOpacity={0.8}>
//       <View style={styles.iconWrap}>
//         <Icon
//           name={item.read ? 'notifications-outline' : 'notifications'}
//           size={22}
//           color={COLORS.PRIMARY}
//         />
//       </View>

//       <View style={styles.content}>
//         <Text style={styles.title}>{item.title}</Text>
//         <Text style={styles.message} numberOfLines={2}>
//           {item.message}
//         </Text>
//         <Text style={styles.time}>{item.time}</Text>
//       </View>

//       {!item.read && <View style={styles.dot} />}
//     </TouchableOpacity>
//   );
// };

// const NotificationScreen = ({navigation}) => {
//   const insets = useSafeAreaInsets();

//   return (
//     <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color={COLORS.white} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Notifications</Text>
//         <TouchableOpacity>
//           <Text style={styles.clearText}>Clear All</Text>
//         </TouchableOpacity>
//       </View>

//       {/* List */}
//       <FlatList
//         data={notifications}
//         keyExtractor={item => item.id}
//         renderItem={({item}) => <NotificationItem item={item} />}
//         contentContainerStyle={{paddingBottom: 20}}
//         showsVerticalScrollIndicator={false}
//       />
//     </SafeAreaView>
//   );
// };

// export default NotificationScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   header: {
//     padding: 16,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: COLORS.primary,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: COLORS.white,
//   },
//   clearText: {
//     fontSize: 14,
//     color: COLORS.white,
//     fontWeight: '600',
//   },
//   card: {
//     backgroundColor: COLORS.CARD,
//     marginHorizontal: 16,
//     marginVertical: 8,
//     borderRadius: 14,
//     padding: 14,
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   iconWrap: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#EAF4FB',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   content: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: COLORS.text,
//     marginBottom: 4,
//   },
//   message: {
//     fontSize: 13,
//     color: COLORS.SUB_TEXT,
//     marginBottom: 6,
//   },
//   time: {
//     fontSize: 12,
//     color: COLORS.SUB_TEXT,
//   },
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: COLORS.blue,
//     marginLeft: 6,
//     marginTop: 6,
//   },
// });
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
      
      navigation.navigate('Orders')
      console.log("changedfdf");
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
});
