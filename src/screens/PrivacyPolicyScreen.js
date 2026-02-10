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
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../constants/colors';
import apiClient from '../utils/apiConfig';
import { fontSize, spacing, wp } from '../utils/dimensions';

const PrivacyPolicyScreen = ({navigation}) => {
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

  const formatText = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str || '');

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.blue} />
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
          tintcolor={COLORS.blue}
        />
      }>
      <View style={styles.contentCard}>
        <View style={styles.headerIconContainer}>
          <Icon name="shield" size={40} color={COLORS.blue} />
        </View>
        <Text style={styles.contentTitle}>LEADWAY GAS Privacy Policy</Text>
        <Text style={styles.contentSubtitle}>
          Your privacy and data security are our top priorities
        </Text>

        <View style={styles.privacyContent}>
          {privacyData.map((policy) => (
            <View key={policy.id} style={styles.privacySection}>
              {policy.title ? (
                <Text style={styles.privacyTitle}>{formatText(policy.title)}</Text>
              ) : null}
              <Text style={styles.privacyDescription}>{formatText(policy.description)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerNote}>
          <Icon name="verified-user" size={20} color={COLORS.blue} />
          <Text style={styles.footerText}>
            We are committed to protecting your privacy and ensuring the security
            of your personal information.
          </Text>
        </View>
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>Questions about Privacy?</Text>
        <Text style={styles.contactText}>
          If you have any questions about this Privacy Policy, please contact us
          at:
        </Text>
        <View style={styles.contactDetails}>
          <View style={styles.contactItem}>
            <Icon name="email" size={16} color={COLORS.blue} />
            <Text style={styles.contactDetail}>support@gasbooking.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Icon name="phone" size={16} color={COLORS.blue} />
            <Text style={styles.contactDetail}>+91 98765 43210</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {loading ? renderLoading() : renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  // backButton: {
  //   padding: 8,
  //   borderRadius: 20,
  //   backgroundColor: 'rgba(255, 255, 255, 0.2)',
  // },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
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
  contentCard: {
    backgroundColor: COLORS.white,
    margin: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerIconContainer: {
    backgroundColor: COLORS.lightBackground,
    padding: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  contentSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  privacyContent: {
    width: '100%',
    marginTop: 2,
  },
  privacySection: {
    marginBottom: 12,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  privacyDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: 'justify',
  },
  footerNote: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    alignItems: 'flex-start',
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginLeft: 8,
  },
  contactInfo: {
    backgroundColor: COLORS.white,
    margin: 12,
    padding: 16,
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
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
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
