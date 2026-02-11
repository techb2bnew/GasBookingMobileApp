import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, StatusBar} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../constants';
import apiClient from '../utils/apiConfig';
import {fontSize, spacing, wp} from '../utils/dimensions';
export default function OngoingOrderDetails({navigation}) {
  
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);
 
  const fetchAgents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await apiClient.post('/api/orders/orderdetails');
      console.log('Fetched orders:', response?.data?.data?.orders?.length);
 
      // Filter out delivered orders - only show non-delivered orders
      const allOrders = response?.data?.data?.orders || [];
      const filteredOrders = allOrders.filter(order => {
        const status = (order?.status || '').toLowerCase();
        return status !== 'delivered';
      });
      
      console.log('Filtered orders (excluding delivered):', filteredOrders.length);
      setAgents(filteredOrders);
    } catch (error) {
      console.log('Error fetching orders', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };
 
  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchAgents(true); // isRefresh = true
  };
 
  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return COLORS.success;
    if (s === 'out_for_delivery' || s === 'out for delivery') return COLORS.primary;
    return '#f59e0b';
  };

  const handleOrderClick = (order) => {
    // Navigate to OrderDetails screen with the order object
    navigation.navigate('OrderDetails', { order });
  };

  const renderOrderCard = ({item}) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleOrderClick(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.cardSummary}>
            <Text style={styles.orderNumber}>#{item?.orderNumber || '—'}</Text>
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(item?.status) + '20' }]}>
              <Text style={[styles.statusPillText, { color: getStatusColor(item?.status) }]}>
                {(item?.status || '—').replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.paymentText}>
              Payment: <Text style={{ color: item?.paymentStatus === 'pending' ? COLORS.error : COLORS.success, fontWeight: '600' }}>
                {item?.paymentStatus === 'pending' ? 'Pending' : 'Paid'}
              </Text>
            </Text>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={COLORS.primary}
              style={styles.chevron}
            />
          </View>
          <Text style={styles.tapHint}>Tap to view full order details</Text>
        </View>
      </TouchableOpacity>
    );
  };
 
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.title}>Ongoing Order</Text>

        <View style={styles.placeholder} />
      </View>
 
      <View style={{padding: 16, flex: 1}}>
        {loading ? (
          <View style={{flex: 1, backgroundColor: COLORS.background}}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={agents}
            keyExtractor={item => item.id}
            renderItem={renderOrderCard}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Feather
            name="clipboard"
            size={70}
            color={COLORS.PLACEHOLDER}
          />
          <Text style={styles.emptyTitle}>Orders Not Found</Text>
          <Text style={styles.emptySubText}>
            No orders are available at the moment.
          </Text>
        </View>
      )}
          />
        )}
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: COLORS.white,
    // marginLeft: 10,
    letterSpacing: -0.5,
    marginBottom: wp('0.5%'),
  },
  placeholder: {
    width: 40,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.white,
  },
 
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 14,
  },
  cardSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chevron: {
    marginLeft: 8,
  },
  tapHint: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 6,
    opacity: 0.9,
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
  },
  detailBlock: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '700',
    color: 'black',
    fontSize: 15,
  },
  sub: {
    fontSize: 14,
    color: '#444',
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
    color: COLORS.primary,
  },
  status: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: 'bold',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 100,
},
emptyTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: "#444",
  marginTop: 12,
},
emptySubText: {
  fontSize: 14,
  color: COLORS.PLACEHOLDER,
  marginTop: 6,
  textAlign: 'center',
},
  value: {
    fontSize: 12,
    color: '#444',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
 