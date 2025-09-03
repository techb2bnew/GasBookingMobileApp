import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import OTPTextInput from 'react-native-otp-textinput';
import { COLORS, STRINGS } from '../constants';
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
import { updateProfile } from '../redux/slices/profileSlice';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hp, wp, fontSize, spacing, borderRadius } from '../utils/dimensions';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { phoneNumber, otpSent, loading } = useSelector(state => state.auth);
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

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
      return;
    }
    setError(""); // ✅ Clear any previous errors
    dispatch(sendOTPStart());

    try {
      const response = await axios.post(
        `${STRINGS.API_BASE_URL}/api/auth/request-otp`,
        {
          email: phoneNumber,
          role: "customer",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("OTP API Success:", response.data);

      dispatch(sendOTPSuccess());
      // setTimer(30); // ❌ Timer removed - only starts on resend click
    } catch (error) {
      console.error("OTP Request Error:", error);

      const message =
        error.response?.data?.message || "Something went wrong. Please try again.";

      setError(message);
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

  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length < 6) {
      setError('Please enter a valid OTP');
      return;
    }

    setError('');
    dispatch(verifyOTPStart());

    try {
      const response = await axios.post(
        `${STRINGS.API_BASE_URL}/api/auth/verify-otp`,
        {
          email: phoneNumber,
          otp: otpValue,
          role: "customer"
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Verify OTP API Response:", response.data);

      if (response.data && response.data.success) {
        const userData = {
          id: response.data.data.user?.id || '1',
          name: response.data.data.user?.name || `Customer_${phoneNumber.slice(-4)}`,
          phoneNumber: response.data.data.user?.phone ,
          email: response.data.data.user?.email ,
          role: response.data.data.user?.role || 'customer',
          profileImage: response.data.data.user?.profileImage || null,
          address: response.data.data.user?.address || null,
          isProfileComplete: response.data.data.user?.isProfileComplete || false,
        };

        const token = response.data.data.token;

        // ✅ Save token to secure storage (you'll need to implement this)
        await AsyncStorage.setItem('userToken', token);
        
        // ✅ Save user data to Redux
        dispatch(verifyOTPSuccess({
          user: userData,
          token: token
        }));
        dispatch(updateProfile(userData));
        
        console.log("Login successful! Token:", token);
        console.log("User data saved:", userData);
      } else {
        dispatch(verifyOTPFailure('Invalid OTP'));
        setError('Invalid OTP');
      }
    } catch (error) {
      console.error("Verify OTP Error:", error);
      dispatch(verifyOTPFailure(error.response?.data?.message || 'Something went wrong'));
      setError(error.response?.data?.message || 'Something went wrong');
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      return; // Don't allow resend if timer is still running
    }

    setError(''); // Clear any previous errors
    dispatch(sendOTPStart());

    try {
      const response = await axios.post(
        `${STRINGS.API_BASE_URL}/api/auth/request-otp`,
        {
          email: phoneNumber,
          role: "customer",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Resend OTP API Success:", response.data);

      if (response.data && response.data.success) {
        dispatch(sendOTPSuccess());
        setTimer(30); // Start resend timer
        setOtpValue(''); // Clear previous OTP input
      } else {
        setError(response.data?.message || "Failed to resend OTP");
        dispatch(sendOTPFailure(response.data?.message || "Failed to resend OTP"));
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      const message = error.response?.data?.message || "Something went wrong. Please try again.";
      setError(message);
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
              dispatch(resetOTP());  // ✅ ab ye kaam karega
            }}
          >
            <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.content}>
          <Text style={styles.title}>{STRINGS.appName}</Text>
          <Text style={styles.subtitle}>
            {otpSent ? STRINGS.verifyOTP : STRINGS.login}
          </Text>
          <View style={{ justifyContent: 'center', height: '70%' }}>
            {!otpSent ? (
              <View style={styles.card}>
                <Text style={styles.label}>{STRINGS.phoneNumber}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={STRINGS.enterPhoneNumber}
                  value={phoneNumber}
                  onChangeText={text => dispatch(setPhoneNumber(text))}
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

                <OTPTextInput
                  containerStyle={styles.otpContainer}
                  textInputStyle={styles.otpInput}
                  handleTextChange={setOtpValue}
                  inputCount={6}
                  keyboardType="numeric"
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
                      timer > 0 && { color: COLORS.gray },
                    ]}>
                    {timer > 0
                      ? `Resend OTP in ${timer}s`
                      : STRINGS.resendOTP}
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
              onPress={() => Linking.openURL(`mailto:${STRINGS.email}?subject=Support%20Request&body=Hello%20Support%20Team,`)}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.contactIcon} />
              <Text style={styles.contactText}>{STRINGS.email}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`tel:${STRINGS.phone}`)}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} style={styles.contactIcon} />
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingBottom: 120, // Extra padding for support button
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: COLORS.primary,
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
    // flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    height: hp(6),
    width: wp(10),
    textAlign: 'center',
    marginRight: wp('0.5%'),
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
    top: spacing.sm,  // notch ke niche rakhne ke liye (iOS/Android adjust kar lena)
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
  contactButtonText: { color: COLORS.black, fontSize: fontSize.md, fontWeight: '600' },
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
