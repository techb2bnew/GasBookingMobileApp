import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { COLORS } from '../constants/colors';
import { logout } from '../redux/slices/authSlice';

const { width } = Dimensions.get('window');

const MenuDrawer = ({ visible, onClose, navigation }) => {
  const dispatch = useDispatch();
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleMenuClose = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleMenuCloseWithCallback = (callback) => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      if (callback) {
        setTimeout(callback, Platform.OS === 'ios' ? 100 : 50);
      }
    });
  };

  const handleRateUs = () => {
    Linking.openURL('https://play.google.com/store/apps/details?id=com.gasbooking.app');
  };

  const handleMySafety = () => {
    // Close menu first, then show safety modal
    handleMenuCloseWithCallback(() => {
      setSafetyModalVisible(true);
    });
  };

  const handleKnowYourPrice = () => {
    // Close menu first, then show price modal
    handleMenuCloseWithCallback(() => {
      setPriceModalVisible(true);
    });
  };

  const handleProfileDetails = () => {
    navigation.navigate('Profile');
    handleMenuClose();
  };

  const handleLogout = () => {
    // Close menu first, then show logout modal
    handleMenuCloseWithCallback(() => {
      setLogoutModalVisible(true);
    });
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    dispatch(logout());
    handleMenuClose();
  };

  const [safetyModalVisible, setSafetyModalVisible] = React.useState(false);
  const [priceModalVisible, setPriceModalVisible] = React.useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={handleMenuClose}>
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleMenuClose}
          />
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}>
            <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
              <Text style={styles.headerTitle}>Menu</Text>
              <TouchableOpacity onPress={handleMenuClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuContainer}>
              <ScrollView style={styles.menuItems}>
                <TouchableOpacity style={styles.menuItem} onPress={handleMySafety}>
                  <Icon name="security" size={24} color={COLORS.primary} />
                  <Text style={styles.menuText}>My Safety</Text>
                  <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleRateUs}>
                  <Icon name="star" size={24} color={COLORS.primary} />
                  <Text style={styles.menuText}>Rate us on Play Store</Text>
                  <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleProfileDetails}>
                  <Icon name="person" size={24} color={COLORS.primary} />
                  <Text style={styles.menuText}>Profile Details</Text>
                  <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleKnowYourPrice}>
                  <Icon name="attach-money" size={24} color={COLORS.primary} />
                  <Text style={styles.menuText}>Know Your Price</Text>
                  <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.logoutSection}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Icon name="logout" size={24} color={COLORS.error} />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Safety Modal */}
      <Modal
        visible={safetyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSafetyModalVisible(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Safety</Text>
              <TouchableOpacity onPress={() => setSafetyModalVisible(false)}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.safetyItem}>
                <Icon name="verified-user" size={20} color={COLORS.success} />
                <Text style={styles.safetyText}>All our delivery partners are verified and background checked</Text>
              </View>
              <View style={styles.safetyItem}>
                <Icon name="location-on" size={20} color={COLORS.success} />
                <Text style={styles.safetyText}>Real-time tracking ensures you know exactly where your order is</Text>
              </View>
              <View style={styles.safetyItem}>
                <Icon name="phone" size={20} color={COLORS.success} />
                <Text style={styles.safetyText}>Direct communication with delivery partner through in-app calling</Text>
              </View>
              <View style={styles.safetyItem}>
                <Icon name="payment" size={20} color={COLORS.success} />
                <Text style={styles.safetyText}>Secure payment options with multiple verification layers</Text>
              </View>
              <View style={styles.safetyItem}>
                <Icon name="support-agent" size={20} color={COLORS.success} />
                <Text style={styles.safetyText}>24/7 customer support for any safety concerns</Text>
              </View>
              <View style={styles.safetyItem}>
                <Icon name="report" size={20} color={COLORS.success} />
                <Text style={styles.safetyText}>Easy reporting system for any issues or concerns</Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Price Modal */}
      <Modal
        visible={priceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPriceModalVisible(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Know Your Price</Text>
              <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.priceSubtitle}>Gas Cylinder Prices by State</Text>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Punjab</Text>
                <Text style={styles.priceText}>₹950 - Domestic</Text>
                <Text style={styles.priceText}>₹1,250 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Haryana</Text>
                <Text style={styles.priceText}>₹980 - Domestic</Text>
                <Text style={styles.priceText}>₹1,280 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Delhi</Text>
                <Text style={styles.priceText}>₹1,050 - Domestic</Text>
                <Text style={styles.priceText}>₹1,350 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Uttar Pradesh</Text>
                <Text style={styles.priceText}>₹920 - Domestic</Text>
                <Text style={styles.priceText}>₹1,220 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Maharashtra</Text>
                <Text style={styles.priceText}>₹1,100 - Domestic</Text>
                <Text style={styles.priceText}>₹1,400 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Karnataka</Text>
                <Text style={styles.priceText}>₹1,080 - Domestic</Text>
                <Text style={styles.priceText}>₹1,380 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Tamil Nadu</Text>
                <Text style={styles.priceText}>₹1,020 - Domestic</Text>
                <Text style={styles.priceText}>₹1,320 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Gujarat</Text>
                <Text style={styles.priceText}>₹1,000 - Domestic</Text>
                <Text style={styles.priceText}>₹1,300 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Rajasthan</Text>
                <Text style={styles.priceText}>₹940 - Domestic</Text>
                <Text style={styles.priceText}>₹1,240 - Commercial</Text>
              </View>

              <View style={styles.priceItem}>
                <Text style={styles.stateName}>Madhya Pradesh</Text>
                <Text style={styles.priceText}>₹930 - Domestic</Text>
                <Text style={styles.priceText}>₹1,230 - Commercial</Text>
              </View>

              <Text style={styles.priceNote}>
                *Prices may vary based on location and delivery charges
              </Text>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Logout</Text>
              <TouchableOpacity onPress={() => setLogoutModalVisible(false)}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.logoutConfirmText}>
                Are you sure you want to logout from your account?
              </Text>
              <View style={styles.logoutButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setLogoutModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmLogoutButton}
                  onPress={confirmLogout}>
                  <Text style={styles.confirmLogoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: width * 0.8,
    backgroundColor: COLORS.white,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    // iOS specific styling to handle status bar
    ...(Platform.OS === 'ios' && {
      paddingTop: 0,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    padding: 5,
  },
  menuContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  menuItems: {
    flex: 1,
  },
  logoutSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 10,
    lineHeight: 20,
  },
  priceSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  priceItem: {
    backgroundColor: COLORS.lightGray,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  stateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  priceText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  priceNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  logoutConfirmText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  logoutButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmLogoutText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MenuDrawer;
