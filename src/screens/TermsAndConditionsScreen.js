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

  const renderTermsItem = (term, index) => (
    <View key={term.id} style={styles.termsItem}>
      <View style={styles.termsHeader}>
        <View style={styles.termsNumberContainer}>
          <Text style={styles.termsNumber}>{index + 1}</Text>
        </View>
        <View style={styles.termsTitleContainer}>
          <Text style={styles.termsTitle}>{term.title ? term.title.charAt(0).toUpperCase() + term.title.slice(1) : term.title}</Text>
        </View>
      </View>
      
      <View style={styles.termsContent}>
        <Text style={styles.termsDescription}>{term.description ? term.description.charAt(0).toUpperCase() + term.description.slice(1) : term.description}</Text>
      </View>
      
      <View style={styles.termsFooter}>
        <View style={styles.versionContainer}>
          <Icon name="info" size={16} color={COLORS.primary} />
          <Text style={styles.versionText}>Version {term.version}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Icon name="schedule" size={16} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>
            {new Date(term.updatedAt).toLocaleDateString('en-IN', {
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
      <View style={styles.contentHeader}>
        <Text style={styles.contentTitle}>LEADWAY GAS Terms & Conditions</Text>
        <Text style={styles.contentSubtitle}>
          Please read these terms carefully before using our services
        </Text>
      </View>

      <View style={styles.termsList}>
        {termsData.map((term, index) => renderTermsItem(term, index))}
      </View>

      <View style={styles.footerNote}>
        <Icon name="warning" size={20} color={COLORS.warning} />
        <Text style={styles.footerText}>
          By using LEADWAY GAS app, you agree to these terms and conditions.
          Last updated: {termsData.length > 0 ? new Date(termsData[0]?.updatedAt).toLocaleDateString('en-IN') : 'N/A'}
        </Text>
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
    backgroundColor: COLORS.primary,
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
  termsList: {
    paddingHorizontal: 20,
  },
  termsItem: {
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
    borderLeftColor: COLORS.primary,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 15,
  },
  termsNumberContainer: {
    backgroundColor: COLORS.primary,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  termsNumber: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsTitleContainer: {
    flex: 1,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  termsContent: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  termsDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'justify',
  },
  termsFooter: {
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
    color: COLORS.primary,
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
});

export default TermsAndConditionsScreen;
