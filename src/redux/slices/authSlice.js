import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  phoneNumber: '',
  otp: '',
  otpSent: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    sendOTPStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    sendOTPSuccess: (state) => {
      state.loading = false;
      state.otpSent = true;
    },
    sendOTPFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setOTP: (state, action) => {
      state.otp = action.payload;
    },
    verifyOTPStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    verifyOTPSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.otp = '';
      state.otpSent = false;
    },
    verifyOTPFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.phoneNumber = '';
      state.otp = '';
      state.otpSent = false;
      state.error = null;
      state.token = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetOTP: (state) => {
      state.otpSent = false;
      state.otp = '';
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setPhoneNumber,
  sendOTPStart,
  sendOTPSuccess,
  sendOTPFailure,
  setOTP,
  verifyOTPStart,
  verifyOTPSuccess,
  verifyOTPFailure,
  logout,
  clearError,
  resetOTP
} = authSlice.actions;

export default authSlice.reducer;

