import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Linking,
  Image,
  StatusBar,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import FastOTPInput from '../components/FastOTPInput';
import {COLORS, STRINGS} from '../constants';
import {
  setPhoneNumber,
  sendOTPStart,
  sendOTPSuccess,
  sendOTPFailure,
  setOTP,
  verifyOTPStart,
  verifyOTPSuccess,
  verifyOTPFailure,
  resetOTP,
} from '../redux/slices/authSlice';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import {updateProfile} from '../redux/slices/profileSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiConfig';
import {hp, wp, fontSize, spacing, borderRadius} from '../utils/dimensions';

const LoginScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {phoneNumber, otpSent, loading} = useSelector(state => state.auth);
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // const handleSendOTP = () => {
  //   if (!phoneNumber || phoneNumber.length < 10) {
  //     setError('Please enter a valid phone number');
  //     return;
  //   }
  //   setError('');
  //   dispatch(sendOTPStart());
  //   setTimeout(() => {
  //     dispatch(sendOTPSuccess());
  //   }, 1000);
  // };
  const handleSendOTP = async () => {
    if (!phoneNumber || !phoneNumber.includes('@')) {
      setError('Please enter a valid email address');
      setTimeout(() => setError(''), 3000); // ✅ Clear error after 3 seconds
      return;
    }
    setError(''); // ✅ Clear any previous errors
    dispatch(sendOTPStart());

    try {
      const response = await apiClient.post('/api/auth/request-otp', {
        email: phoneNumber,
        role: 'customer',
      });

      console.log('OTP API Success:', response.data);

      dispatch(sendOTPSuccess());
      // setTimer(30); // ❌ Timer removed - only starts on resend click
    } catch (error) {
      console.error('OTP Request Error:', error);
      console.error('Error Response:>>', error.response);
      console.error('Error Response Data:', error.response?.data);

      // Try multiple possible error message locations
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === 'string'
          ? error.response?.data
          : null) ||
        error.message ||
        'Something went wrong. Please try again.';

      console.log('Final Error Message:', message);
      setError(message);
      setTimeout(() => setError(''), 3000); // ✅ Clear error after 3 seconds
      dispatch(sendOTPFailure(message)); // ✅ Reset loading state on error
    }
  };

  // const handleVerifyOTP = () => {
  //   if (!otpValue || otpValue.length < 6) {
  //     setError('Please enter a valid OTP');
  //     return;
  //   }
  //   setError('');
  //   dispatch(verifyOTPStart());
  //   setTimeout(() => {
  //     if (otpValue === '1234' || otpValue.length === 6) {
  //       const userData = {
  //         id: '1',
  //         name: `Customer_${phoneNumber.slice(-4)}`,
  //         phoneNumber: phoneNumber,
  //         email: '',
  //       };
  //       dispatch(verifyOTPSuccess(userData));

  //       // ✅ Profile me bhi phone number update
  //       dispatch(updateProfile(userData));

  //     } else {
  //       dispatch(verifyOTPFailure('Invalid OTP'));
  //       setError('Invalid OTP');
  //     }
  //   }, 1000);
  // };
  useEffect(() => {
    const fetchFcmToken = async () => {
      try {
        const token = await AsyncStorage.getItem('fcmToken');
        if (token) {
          console.log('FCM token (from storage):', token);
          setFcmToken(token);
        } else {
          console.log('No FCM token found in storage');
        }
      } catch (error) {
        console.log('Error fetching FCM token:', error);
      }
    };

    fetchFcmToken();
  }, []);
  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length < 6) {
      setError('Please enter a valid OTP');
      setTimeout(() => setError(''), 3000); // ✅ Clear error after 3 seconds
      return;
    }

    setError('');
    dispatch(verifyOTPStart());
    const payload = {
       email: phoneNumber,
        otp: otpValue,
        role: 'customer',
        fcmToken: fcmToken,
        fcmDeviceType: Platform.OS,
    }
console.log("payload>>",payload);

    try {
      const response = await apiClient.post('/api/auth/verify-otp', {
        email: phoneNumber,
        otp: otpValue,
        role: 'customer',
        fcmToken: fcmToken,
        fcmDeviceType: Platform.OS,
      });

      console.log('Verify OTP API Response:', response.data);

      if (response.data && response.data.success) {
        const userData = {
          id: response.data.data.user?.id || '1',
          name:
            response.data.data.user?.name ||
            `Customer_${phoneNumber.slice(-4)}`,
          phoneNumber: response.data.data.user?.phone,
          email: response.data.data.user?.email,
          role: response.data.data.user?.role || 'customer',
          profileImage: response.data.data.user?.profileImage || null,
          address: response.data.data.user?.address || null,
          isProfileComplete:
            response.data.data.user?.isProfileComplete || false,
        };

        const token = response.data.data.token;

        // ✅ Save token and user data for API and Socket
        await AsyncStorage.setItem('userToken', token); // Keep for backward compatibility
        await AsyncStorage.setItem('authToken', token); // For socket service
        await AsyncStorage.setItem('userId', userData.id.toString());
        await AsyncStorage.setItem('userRole', userData.role);

        console.log('✅ Login successful - Auth data saved for socket');
        console.log('📝 UserId:', userData.id);
        console.log('📝 UserRole:', userData.role);

        // ✅ Save user data to Redux
        dispatch(
          verifyOTPSuccess({
            user: userData,
            token: token,
          }),
        );
        dispatch(updateProfile(userData));

        console.log('Login successful! Token:', token);
        console.log('User data saved:', userData);
      } else {
        dispatch(verifyOTPFailure('Invalid OTP'));
        setError('Invalid OTP');
        setTimeout(() => setError(''), 3000); // ✅ Clear error after 3 seconds
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      console.error('Error Response Data:', error.response?.data);

      // Try multiple possible error message locations
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === 'string'
          ? error.response?.data
          : null) ||
        error.message ||
        'Something went wrong';

      console.log('Final Error Message:', message);
      dispatch(verifyOTPFailure(message));
      setError(message);
      setTimeout(() => setError(''), 3000); // ✅ Clear error after 3 seconds
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      return; // Don't allow resend if timer is still running
    }

    setError(''); // Clear any previous errors
    dispatch(sendOTPStart());

    try {
      const response = await apiClient.post('/api/auth/request-otp', {
        email: phoneNumber,
        role: 'customer',
      });

      console.log('Resend OTP API Success:', response.data);

      if (response.data && response.data.success) {
        dispatch(sendOTPSuccess());
        setTimer(30); // Start resend timer
        setOtpValue(''); // Clear previous OTP input
      } else {
        const errorMsg = response.data?.message || 'Failed to resend OTP';
        setError(errorMsg);
        setTimeout(() => setError(''), 3000); // ✅ Clear error after 3 seconds
        dispatch(sendOTPFailure(errorMsg));
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      console.error('Error Response Data:', error.response?.data);

      // Try multiple possible error message locations
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === 'string'
          ? error.response?.data
          : null) ||
        error.message ||
        'Something went wrong. Please try again.';

      console.log('Final Error Message:', message);
      setError(message);
      setTimeout(() => setError(''), 3000); // ✅ Clear error after 3 seconds
      dispatch(sendOTPFailure(message));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {otpSent && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setOtpValue('');
              setError('');
              dispatch(resetOTP()); // ✅ ab ye kaam karega
            }}>
            <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.content}>
          {/* <Text style={styles.title}>{STRINGS.appName}</Text> */}
          <Text style={styles.subtitle}>
            {otpSent ? STRINGS.verifyOTP : STRINGS.login}
          </Text>
          <View style={{alignItems: 'center'}}>
            <Image
              source={require('../assets/leadIcon.png')}
              style={styles.logoImage}
            />
          </View>
          <View style={{justifyContent: 'center', height: '40%'}}>
            {!otpSent ? (
              <View style={styles.card}>
                <Text style={styles.label}>{STRINGS.phoneNumber}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={STRINGS.enterPhoneNumber}
                  value={phoneNumber}
                  onChangeText={text => dispatch(setPhoneNumber(text))}
                  autoCapitalize="none"
                  // keyboardType="phone-pad"
                  // maxLength={10}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={loading}>
                  <Text style={styles.buttonText}>
                    {loading ? STRINGS.loading : STRINGS.sendOTP}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.label}>{STRINGS.enterOTP}</Text>
                <Text style={styles.otpInfo}>OTP sent to {phoneNumber}</Text>

                <FastOTPInput
                  length={6}
                  value={otpValue}
                  onChangeText={setOtpValue}
                  containerStyle={styles.otpContainer}
                  inputStyle={styles.otpInput}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading}>
                  <Text style={styles.buttonText}>
                    {loading ? STRINGS.loading : STRINGS.verifyOTP}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={timer > 0}>
                  <Text
                    style={[
                      styles.resendText,
                      timer > 0 && {color: COLORS.gray},
                    ]}>
                    {timer > 0 ? `Resend OTP in ${timer}s` : STRINGS.resendOTP}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Contact Support Button - Fixed position behind keyboard */}
      <View style={styles.supportButtonContainer}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Support */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close button with cross icon */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Contact Support</Text>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() =>
                Linking.openURL(
                  `mailto:${STRINGS.email}?subject=Support%20Request&body=Hello%20Support%20Team,`,
                )
              }>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.primary}
                style={styles.contactIcon}
              />
              <Text style={styles.contactText}>{STRINGS.email}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`tel:${STRINGS.phone}`)}>
              <Ionicons
                name="call-outline"
                size={20}
                color={COLORS.primary}
                style={styles.contactIcon}
              />
              <Text style={styles.contactText}>{STRINGS.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingBottom: 30, // Extra padding for support button
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: '#035DB7',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  logoImage: {
    width: 160,
    height: 140,
  },
  label: {
    fontSize: fontSize.md,
    color: COLORS.text,
    marginBottom: spacing.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    backgroundColor: COLORS.white,
    marginBottom: spacing.sm,
  },
  error: {
    color: 'red',
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  otpInfo: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
    gap: wp('1%'),
  },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    height: hp(6.5),
    width: wp(12),
  },
  resendButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: spacing.sm, // notch ke niche rakhne ke liye (iOS/Android adjust kar lena)
    left: spacing.lg,
    zIndex: 10,
    padding: wp('2%'),
  },
  backButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  supportButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingBottom: spacing.lg,
    zIndex: 1000,
  },
  contactButton: {
    // backgroundColor: COLORS.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    margin: spacing.lg,
    alignItems: 'center',
  },
  contactButtonText: {
    color: COLORS.black,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    width: wp('80%'),
    alignItems: 'center',
    position: 'relative',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.lg,
    color: COLORS.primary,
    marginTop: spacing.sm,
  },
  contactText: {
    fontSize: fontSize.md,
    color: COLORS.text,
    flex: 1,
  },
  modalCloseButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: wp('2%'),
    backgroundColor: COLORS.lightGray,
    borderRadius: wp('5%'),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: COLORS.lightGray,
    width: '100%',
  },
  contactIcon: {
    marginRight: spacing.md,
  },
});

export default LoginScreen;
