import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { hp, wp, fontSize, borderRadius } from '../utils/dimensions';

const FastOTPInput = ({ 
  length = 6, 
  onChangeText, 
  containerStyle, 
  inputStyle,
  value = ''
}) => {
  const [otp, setOtp] = useState(value.split('').slice(0, length));
  const inputs = useRef([]);

  useEffect(() => {
    // External value change (like reset)
    if (value === '') {
      setOtp(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (text, index) => {
    // Only allow numbers
    const newText = text.replace(/[^0-9]/g, '');
    
    if (newText === '') {
      // Handle backspace
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      onChangeText(newOtp.join(''));
      
      // Move to previous input
      if (index > 0) {
        inputs.current[index - 1]?.focus();
      }
      return;
    }

    // Handle paste (multiple characters)
    if (newText.length > 1) {
      const digits = newText.split('').slice(0, length);
      const newOtp = Array(length).fill('');
      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      onChangeText(newOtp.join(''));
      
      // Focus on next empty field or last field
      const nextIndex = Math.min(digits.length, length - 1);
      inputs.current[nextIndex]?.focus();
      return;
    }

    // Normal single character input
    const newOtp = [...otp];
    newOtp[index] = newText;
    setOtp(newOtp);
    onChangeText(newOtp.join(''));

    // Auto-focus next input
    if (index < length - 1 && newText) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // If current input is empty and backspace pressed, go to previous
      inputs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index) => {
    // Select the text when focused for easy override
    if (otp[index]) {
      inputs.current[index]?.setSelection(0, 1);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {Array(length).fill(0).map((_, index) => (
        <TextInput
          key={index}
          ref={ref => (inputs.current[index] = ref)}
          style={[
            styles.input,
            inputStyle,
            otp[index] && styles.inputFilled
          ]}
          value={otp[index] || ''}
          onChangeText={text => handleChange(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          blurOnSubmit={false}
          returnKeyType="next"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp('1%'),
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: borderRadius.md,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    height: hp(6),
    width: wp(12),
    textAlign: 'center',
  },
  inputFilled: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
});

export default FastOTPInput;

