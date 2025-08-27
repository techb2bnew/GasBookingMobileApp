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
  setOTP,
  verifyOTPStart,
  verifyOTPSuccess,
  verifyOTPFailure,
  resetOTP,
} from '../redux/slices/authSlice';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import { updateProfile } from '../redux/slices/profileSlice';

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

  const handleSendOTP = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    dispatch(sendOTPStart());
    setTimeout(() => {
      dispatch(sendOTPSuccess());
    }, 1000);
  };

  const handleVerifyOTP = () => {
    if (!otpValue || otpValue.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    setError('');
    dispatch(verifyOTPStart());
    setTimeout(() => {
      if (otpValue === '1234' || otpValue.length === 4) {
        const userData = {
          id: '1',
          name: 'User',
          phoneNumber: phoneNumber,
          email: '',
        };
        dispatch(verifyOTPSuccess(userData));

        // ✅ Profile me bhi phone number update
        dispatch(updateProfile(userData));

      } else {
        dispatch(verifyOTPFailure('Invalid OTP'));
        setError('Invalid OTP');
      }
    }, 1000);
  };

  const handleResendOTP = () => {
    if (timer === 0) {
      setOtpValue('');
      dispatch(sendOTPStart());
      setTimeout(() => {
        dispatch(sendOTPSuccess());
        setTimer(30);
      }, 1000);
    }
  };



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                  keyboardType="phone-pad"
                  maxLength={10}
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
                <Text style={styles.otpInfo}>OTP sent to +91 {phoneNumber}</Text>

                <OTPTextInput
                  containerStyle={styles.otpContainer}
                  textInputStyle={styles.otpInput}
                  handleTextChange={setOtpValue}
                  inputCount={4}
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
      {/* Contact Support Button */}
      <TouchableOpacity
        style={styles.contactButton}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.contactButtonText}>Contact Support</Text>
      </TouchableOpacity>

      {/* Modal for Support */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contact Support</Text>

            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${STRINGS.email}?subject=Support%20Request&body=Hello%20Support%20Team,`)}>
              <Text style={styles.contactText}>Email: {STRINGS.email}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Linking.openURL(`tel:${STRINGS.phone}`)}>
              <Text style={styles.contactText}>Phone: {STRINGS.phone}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: COLORS.white,
    marginBottom: 10,
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  otpInfo: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    justifyContent: 'space-between',
    margin: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    height: 55,
    width: 55,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 10,  // notch ke niche rakhne ke liye (iOS/Android adjust kar lena)
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  contactButton: {
    // backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    margin: 20,
    alignItems: 'center',
  },
  contactButtonText: { color: COLORS.black, fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: COLORS.primary,
  },
  contactText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 15,
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  closeButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});

export default LoginScreen;
