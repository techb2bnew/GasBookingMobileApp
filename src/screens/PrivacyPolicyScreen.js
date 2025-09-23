import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants/colors';
import apiClient from '../utils/apiConfig';

const PrivacyPolicyScreen = ({ navigation }) => {
  const [privacyData, setPrivacyData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchPrivacyPolicies = async () => {
    try {
      const response = await apiClient.get('/api/public/privacy-policies');
      if (response.data.success) {
        setPrivacyData(response.data.data.privacyPolicies);
      }
    } catch (error) {
      console.error('Error fetching privacy policies:', error);
      Alert.alert('Error', 'Failed to load Privacy Policy. Please try again.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchPrivacyPolicies();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrivacyPolicies();
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Icon name="privacy-tip" size={28} color={COLORS.white} />
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <View style={styles.placeholder} />
    </View>
  );

  const renderPrivacyItem = (policy, index) => (
    <View key={policy.id} style={styles.privacyItem}>
      <View style={styles.privacyHeader}>
        <View style={styles.iconContainer}>
          <Icon name="security" size={24} color={COLORS.white} />
        </View>
        <View style={styles.privacyTitleContainer}>
          <Text style={styles.privacyTitle}>{policy.title ? policy.title.charAt(0).toUpperCase() + policy.title.slice(1) : policy.title}</Text>
        </View>
      </View>
      
      <View style={styles.privacyContent}>
        <Text style={styles.privacyDescription}>{policy.description ? policy.description.charAt(0).toUpperCase() + policy.description.slice(1) : policy.description}</Text>
      </View>
      
      <View style={styles.privacyFooter}>
        <View style={styles.versionContainer}>
          <Icon name="info" size={16} color={COLORS.success} />
          <Text style={styles.versionText}>Version {policy.version}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Icon name="schedule" size={16} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>
            {new Date(policy.updatedAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.success} />
      <Text style={styles.loadingText}>Loading Privacy Policy...</Text>
    </View>
  );

  const renderContent = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.success]}
          tintColor={COLORS.success}
        />
      }>
      <View style={styles.contentHeader}>
        <View style={styles.headerIconContainer}>
          <Icon name="shield" size={40} color={COLORS.success} />
        </View>
        <Text style={styles.contentTitle}>Gas Booking Privacy Policy</Text>
        <Text style={styles.contentSubtitle}>
          Your privacy and data security are our top priorities
        </Text>
      </View>

      <View style={styles.privacyList}>
        {privacyData.map((policy, index) => renderPrivacyItem(policy, index))}
      </View>

      <View style={styles.footerNote}>
        <Icon name="verified-user" size={20} color={COLORS.success} />
        <Text style={styles.footerText}>
          We are committed to protecting your privacy and ensuring the security of your personal information.
          Last updated: {privacyData.length > 0 ? new Date(privacyData[0]?.updatedAt).toLocaleDateString('en-IN') : 'N/A'}
        </Text>
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>Questions about Privacy?</Text>
        <Text style={styles.contactText}>
          If you have any questions about this Privacy Policy, please contact us at:
        </Text>
        <View style={styles.contactDetails}>
          <View style={styles.contactItem}>
            <Icon name="email" size={16} color={COLORS.success} />
            <Text style={styles.contactDetail}>support@gasbooking.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Icon name="phone" size={16} color={COLORS.success} />
            <Text style={styles.contactDetail}>+91 98765 43210</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {loading ? renderLoading() : renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.success,
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 10,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  contentHeader: {
    backgroundColor: COLORS.white,
    padding: 25,
    margin: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  headerIconContainer: {
    backgroundColor: COLORS.lightBackground,
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  privacyList: {
    paddingHorizontal: 20,
  },
  privacyItem: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.success,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 15,
  },
  iconContainer: {
    backgroundColor: COLORS.success,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  privacyTitleContainer: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  privacyContent: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  privacyDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'justify',
  },
  privacyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.lightBackground,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  footerNote: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginLeft: 10,
  },
  contactInfo: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  contactDetails: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactDetail: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 10,
    fontWeight: '500',
  },
});

export default PrivacyPolicyScreen;
