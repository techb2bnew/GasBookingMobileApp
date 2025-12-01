// import React, {useState} from 'react';
// import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import {COLORS} from '../constants';
// import {fontSize, spacing} from '../utils/dimensions';
// import Ionicons from 'react-native-vector-icons/dist/Ionicons';

// export default function OngoingOrderDetails({navigation}) {
//   const [ongoingOrder, setOngoingOrder] = useState({id: '4521'});

//   return (
//     <View style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={28} color={COLORS.white} />
//         </TouchableOpacity>
//         <View>
//           <Text style={styles.title}>Ongoing Order</Text>
//           <Text style={styles.subtitle}>
//             {ongoingOrder
//               ? 'Your gas cylinder is on the way'
//               : 'No active order'}
//           </Text>
//         </View>
//       </View>

//       <View style={{padding: 16}}>
//         {/* If NO order */}
//         {!ongoingOrder && (
//           <View style={{alignItems: 'center', marginTop: 50}}>
//             <Icon name="info" size={60} color={COLORS.primary} />
//             <Text style={{fontSize: 20, marginTop: 10, color: '#555'}}>
//               No ongoing order
//             </Text>
//             <Text style={{fontSize: 14, color: '#777', marginTop: 5}}>
//               You have no active gas booking right now.
//             </Text>
//           </View>
//         )}

//         {/* If order EXISTS, show details */}
//         {ongoingOrder && (
//           <>
//             {/* Order Details */}
//             <View style={{padding: 16}}>
//               {/* Status Box */}
//               <View style={styles.statusBox}>
//                 <Icon
//                   name="local-gas-station"
//                   size={40}
//                   color={COLORS.primary}
//                 />
//                 <View>
//                   <Text style={styles.statusText}>Cylinder Booked</Text>
//                   <Text style={styles.statusSub}>Booking ID: #LG4521</Text>
//                 </View>
//               </View>

//               {/* Details Card */}
//               <View style={styles.card}>
//                 <Text style={styles.cardTitle}>Order Details</Text>

//                 <View style={styles.row}>
//                   <Text style={styles.label}>Delivery Person:</Text>
//                   <Text style={styles.value}>Rahul Kumar</Text>
//                 </View>

//                 <View style={styles.row}>
//                   <Text style={styles.label}>Contact:</Text>
//                   <Text style={styles.value}>+91 9876543210</Text>
//                 </View>

//                 <View style={styles.row}>
//                   <Text style={styles.label}>Cylinder Type:</Text>
//                   <Text style={styles.value}>14.2 KG</Text>
//                 </View>

//                 <View style={styles.row}>
//                   <Text style={styles.label}>Amount:</Text>
//                   <Text style={styles.value}>₹ 1140</Text>
//                 </View>

//                 <View style={styles.row}>
//                   <Text style={styles.label}>Delivery ETA:</Text>
//                   <Text style={styles.value}>Today, 3:00 PM - 5:00 PM</Text>
//                 </View>
//               </View>
//             </View>
//           </>
//         )}
//       </View>
//     </View>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     paddingHorizontal: spacing.lg,
//     paddingVertical: spacing.sm,
//     backgroundColor: COLORS.primary,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//     shadowColor: COLORS.shadow,
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   title: {
//     fontSize: fontSize.xl,
//     fontWeight: '600',
//     color: COLORS.white,
//   },

//   subtitle: {
//     fontSize: 12,
//     color: COLORS.white,
//   },
//   statusBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#eaf2ff',
//     padding: 16,
//     borderRadius: 16,
//     marginBottom: 20,
//     gap: 14,
//   },
//   statusText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: COLORS.primary,
//   },
//   statusSub: {
//     fontSize: 14,
//     color: '#555',
//   },
//   card: {
//     backgroundColor: '#f8f8f8',
//     padding: 16,
//     borderRadius: 16,
//     marginBottom: 20,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 12,
//     color: '#333',
//   },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   label: {
//     fontSize: 15,
//     color: '#555',
//   },
//   value: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#222',
//   },
//   trackBtn: {
//     backgroundColor: '#007bff',
//     padding: 16,
//     borderRadius: 18,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   trackText: {
//     color: '#fff',
//     fontSize: 17,
//     fontWeight: '600',
//   },
// });
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../constants';
import apiClient from '../utils/apiConfig';

export default function OngoingOrderDetails({navigation}) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await apiClient.post('/api/orders/orderdetails');

      console.log('');

      setAgents(response?.data?.data?.orders);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const renderAgent = ({item}) => (
    <View style={styles.card}>
      <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
        <View style={{flex: 1}}>
          <Text style={styles.sub}>
            <Text style={{fontWeight: '700', fontSize: 15, color: 'black'}}>
              Name:{' '}
            </Text>
            {item.name}
          </Text>
          <Text style={styles.sub}>
            <Text style={{fontWeight: '700', fontSize: 15, color: 'black'}}>
              Phone:{' '}
            </Text>{' '}
            {item.phone}
          </Text>
          <Text style={styles.sub}>Vehicle: {item.vehicleNumber}</Text>
          <Text
            style={[
              styles.status,
              {color: item.status === 'offline' ? 'red' : 'green'},
            ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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
          <Text style={{textAlign: 'center', marginTop: 40}}>Loading...</Text>
        ) : (
          <FlatList
            data={agents}
            keyExtractor={item => item.id}
            renderItem={renderAgent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 50,
    backgroundColor: '#ddd',
  },

  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },

  sub: {
    fontSize: 13,
    color: '#666',
  },

  status: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
  },
});
