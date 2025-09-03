import { Dimensions, PixelRatio } from 'react-native';

export const widthPercentageToDP = widthPercent => {
  const screenWidth = Dimensions.get('window').width;
  const elemWidth = parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};

export const heightPercentageToDP = heightPercent => {
  const screenHeight = Dimensions.get('window').height;
  const elemHeight = parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
};

// Additional utility functions for common dimensions
export const wp = widthPercentageToDP;
export const hp = heightPercentageToDP;

// Common screen dimensions
export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;

// Responsive font sizes
export const fontSize = {
  xs: wp('2.5%'),    // 10px on 400px screen
  sm: wp('3%'),      // 12px on 400px screen
  md: wp('4%'),      // 16px on 400px screen
  lg: wp('5%'),      // 20px on 400px screen
  xl: wp('6%'),      // 24px on 400px screen
  xxl: wp('8%'),     // 32px on 400px screen
};

// Responsive spacing
export const spacing = {
  xs: wp('1%'),      // 4px on 400px screen
  sm: wp('2%'),      // 8px on 400px screen
  md: wp('3%'),      // 12px on 400px screen
  lg: wp('4%'),      // 16px on 400px screen
  xl: wp('6%'),      // 24px on 400px screen
  xxl: wp('8%'),     // 32px on 400px screen
};

// Responsive border radius
export const borderRadius = {
  sm: wp('1%'),      // 4px on 400px screen
  md: wp('2%'),      // 8px on 400px screen
  lg: wp('3%'),      // 12px on 400px screen
  xl: wp('4%'),      // 16px on 400px screen
  round: wp('50%'),  // 50% for circular elements
};
