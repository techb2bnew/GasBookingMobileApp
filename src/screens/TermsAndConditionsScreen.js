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
import { COLORS } from '../constants/colors';
import apiClient from '../utils/apiConfig';
import { fontSize, spacing, wp } from '../utils/dimensions';

const TermsAndConditionsScreen = ({ navigation }) => {
  const [termsData, setTermsData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchTermsAndConditions = async () => {
    try {
      const response = await apiClient.get('/api/public/terms-and-conditions');
      if (response.data.success) {
        setTermsData(response.data.data.termsAndConditions);
      }
    } catch (error) {
      console.error('Error fetching terms and conditions:', error);
      Alert.alert('Error', 'Failed to load Terms & Conditions. Please try again.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchTermsAndConditions();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTermsAndConditions();
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
        <Icon name="description" size={28} color={COLORS.white} />
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>
      <View style={styles.placeholder} />
    </View>
  );

  const formatText = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str || '');

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading Terms & Conditions...</Text>
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
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }>
      <View style={styles.contentCard}>
        <Text style={styles.contentTitle}>LEADWAY GAS Terms & Conditions</Text>
        <Text style={styles.contentSubtitle}>
          Please read these terms carefully before using our services
        </Text>

        <View style={styles.termsContent}>
          {termsData.map((term) => (
            <View key={term.id} style={styles.termsSection}>
              {term.title ? (
                <Text style={styles.termsTitle}>{formatText(term.title)}</Text>
              ) : null}
              <Text style={styles.termsDescription}>{formatText(term.description)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerNote}>
          <Icon name="warning" size={20} color={COLORS.warning} />
          <Text style={styles.footerText}>
            By using LEADWAY GAS app, you agree to these terms and conditions.
          </Text>
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
    paddingTop: 20,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
  termsContent: {
    marginTop: 2,
  },
  termsSection: {
    marginBottom: 12,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  termsDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: 'justify',
  },
  footerNote: {
    flexDirection: 'row',
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
});

export default TermsAndConditionsScreen;
