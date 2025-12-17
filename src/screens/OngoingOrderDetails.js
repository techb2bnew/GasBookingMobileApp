import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../constants';
import apiClient from '../utils/apiConfig';
import {fontSize, spacing} from '../utils/dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function OngoingOrderDetails({navigation}) {
    const insets = useSafeAreaInsets();
  
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
      console.log('jhsfbas', response?.data?.data?.orders?.length);
 
      setAgents(response?.data?.data?.orders || []);
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
 
  const renderOrderCard = ({item}) => {
    return (
      <View style={styles.card}>
        {/* ORDER INFO */}
        <View style={{marginBottom: 10}}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Order No:</Text>
            <Text style={styles.value}>#{item?.orderNumber || '—'}</Text>
          </View>
 
          <View style={styles.rowBetween}>
            <Text style={[styles.label]}>Order Status:</Text>
            <Text
              style={[
                styles.value,
                {color: item?.status === 'delivered' ? 'green' : 'orange'},
              ]}>
              {item?.status?.toUpperCase() || '—'}
            </Text>
          </View>
 
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Payment:</Text>
            <Text
              style={[
                styles.value,
                {color: item?.paymentStatus === 'pending' ? 'red' : 'green'},
              ]}>
              {item?.paymentStatus?.toUpperCase() || '—'}
            </Text>
          </View>
        </View>
 
        {/* AGENCY INFO */}
        <View style={{marginBottom: 10}}>
          <Text style={styles.sectionTitle}>Agency Info</Text>
 
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Agency Name:</Text>
            <Text style={styles.value}>{item?.agency?.name || '—'}</Text>
          </View>
 
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{item?.agency?.phone || '—'}</Text>
          </View>
 
          <View style={styles.rowBetween}>
            <Text style={styles.label}>City:</Text>
            <Text style={styles.value}>{item?.agency?.city || '—'}</Text>
          </View>
 
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Status:</Text>
            <Text
              style={[
                styles.value,
                {color: item?.agency?.status === 'active' ? 'green' : 'red'},
              ]}>
              {item?.agency?.status?.toUpperCase()}
            </Text>
          </View>
        </View>
 
        {/* ASSIGNED AGENT */}
        {item?.assignedAgent && (
          <View>
            <Text style={styles.sectionTitle}>Assigned Agent</Text>
 
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>
                {item?.assignedAgent?.name || '—'}
              </Text>
            </View>
 
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>
                {item?.assignedAgent?.phone || '—'}
              </Text>
            </View>
 
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Vehicle:</Text>
              <Text style={styles.value}>
                {item?.assignedAgent?.vehicleNumber || '—'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };
 
  return (
    <View style={[styles.container,{paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
 
        <View>
          <Text style={styles.title}>Ongoing Order</Text>
          {/* <Text style={styles.subtitle}>Delivery Agents List</Text> */}
        </View>
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
    gap: 10,
    padding: 16,
    backgroundColor: COLORS.primary,
  },
 
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
  },
 
  subtitle: {
    fontSize: 12,
    color: COLORS.white,
  },
 
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 3,
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
 