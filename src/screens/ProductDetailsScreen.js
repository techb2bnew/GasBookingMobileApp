import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { addToCart } from '../redux/slices/cartSlice';
import { COLORS, STRINGS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';

const { width: screenWidth } = Dimensions.get('window');

const WEIGHTS = ['2kg', '5kg', '14.2kg', '19kg'];

const ProductDetailsScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { totalItems } = useSelector(state => state.cart);
  const { product: routeProduct = {} } = route.params || {};

  const [product, setProduct] = useState(routeProduct);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productError, setProductError] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(routeProduct?.weight);
  const [selectedCategory] = useState(routeProduct?.category || 'LPG');

  // Fetch product details by ID from API
  const fetchProductDetails = async (productId) => {
    if (!productId) {
      console.log('No product ID provided');
      return;
    }

    try {
      setIsLoadingProduct(true);
      setProductError(null);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Fetching product details for ID:', productId);
      console.log('Token available:', !!token);
      console.log('API URL:', `${STRINGS.API_BASE_URL}/api/products/${productId}`);

      const response = await axios.get(
        `${STRINGS.API_BASE_URL}/api/products/${productId}`,
        { headers }
      );

      console.log('Product Details API Response:', response.data);

      if (response.data && response.data.success) {
        const productData = response.data.data.product;
        setProduct(productData);

        // Update selected weight if product has variants
        if (productData.variants && productData.variants.length > 0) {
          setSelectedWeight(productData.variants[0].label);
        }

        console.log('Product details loaded:', productData);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch product details');
      }

    } catch (error) {
      console.error('Error fetching product details:', error);

      // Set error message safely to prevent crashes
      let errorMessage = 'Failed to load product details. Please try again.';

      if (error.response?.status === 404) {
        errorMessage = 'Product not found';
        console.log('Product not found (404)');
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login to view product details';
        console.log('Unauthorized access (401)');
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
        console.log('Network error occurred');
      }

      setProductError(errorMessage);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Fetch product details when component mounts
  useEffect(() => {
    console.log('Route Product ID:', routeProduct?.id);
    console.log('Route Product:', routeProduct);

    if (routeProduct?.id) {
      fetchProductDetails(routeProduct.id);
    } else {
      console.log('No product ID found in route params');
      setProductError('No product information available');
    }
  }, [routeProduct?.id]);

  // --- Price calculator ---
  const unitPrice = useMemo(() => {
    // If product has variants, use the selected variant's price
    if (product?.variants && product.variants.length > 0) {
      const selectedVariant = product.variants.find(v => v.label === selectedWeight);
      if (selectedVariant) {
        return Number(selectedVariant.price || 0);
      }
    }

    // Fallback to base price calculation for LPG
    if (selectedCategory !== 'LPG') return Number(product?.price || 0);
    switch (selectedWeight) {
      case '2kg':
        return 200;
      case '5kg':
        return 450;
      case '14.2kg':
        return 850;
      case '19kg':
        return 1200;
      default:
        return Number(product?.price || 0);
    }
  }, [selectedCategory, selectedWeight, product]);

  const totalPrice = useMemo(() => Math.round(unitPrice * selectedQuantity), [unitPrice, selectedQuantity]);

  // --- Cart helpers ---
  const pushToCart = (extra = {}) => {
    const cartProduct = {
      ...product,
      weight: selectedWeight,
      category: selectedCategory,
      quantity: selectedQuantity,
      price: unitPrice, // price per unit
      ...extra,
    };
    dispatch(addToCart({ product: cartProduct, quantity: selectedQuantity }));
  };

  const handleAddToCart = () => pushToCart();
  const handleRefill = () => pushToCart({ type: 'refill' });
  const handleNewConnection = () => pushToCart({ type: 'new_connection' });
  const handleSpare = () => pushToCart({ type: 'spare' });

  const inStock = product?.inStock ?? true;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isLoadingProduct ? 'Loading...' : (STRINGS?.productDetails || 'Product Details')}
        </Text>

        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Cart')}>
          <Icon name="shopping-cart" size={20} color={COLORS.white} />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {isLoadingProduct && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading product details...</Text>
          </View>
        )}

        {/* Error State */}
        {productError && !isLoadingProduct && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{productError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => routeProduct?.id && fetchProductDetails(routeProduct.id)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Product Content - Only show when not loading and no error */}
        {!isLoadingProduct && !productError && product && (
          <>
            {/* Hero Image */}
            <View style={styles.heroWrap}>
              <Image source={{ uri: product?.images?.[0] || product?.image }} style={styles.heroImg} resizeMode="contain" />
              <View style={styles.heroOverlay} />
              <View style={styles.heroTags}>
                <View style={styles.tagPill}>
                  <Icon name="local-gas-station" size={14} color={COLORS.white} />
                  <Text style={styles.tagTxt}>{selectedCategory}</Text>
                </View>
                {selectedWeight && (
                  <View style={[styles.tagPill, { backgroundColor: COLORS.blackOpacity5 }]}>
                    <Icon name="scale" size={14} color={COLORS.white} />
                    <Text style={styles.tagTxt}>{selectedWeight}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Card: Title & Meta */}
            <View style={styles.card}>
              <Text style={styles.name} numberOfLines={2}>
                {product?.productName || product?.name || 'Product'}
              </Text>
              {!!product?.description && (
                <Text style={styles.desc} numberOfLines={3}>
                  {product.description}
                </Text>
              )}
            </View>

            {/* Card: Weight + Qty */}
            <View style={styles.card}>
              {selectedCategory !== 'Accessories' && product?.variants && product.variants.length > 0 && (
                <>
                  <Text style={styles.cardTitle}>Select Weight</Text>
                  <View style={styles.chipsRow}>
                    {product.variants.map(variant => (
                      <TouchableOpacity
                        key={variant.label}
                        style={[styles.chip, selectedWeight === variant.label && styles.chipActive]}
                        onPress={() => setSelectedWeight(variant.label)}
                      >
                        <Text style={[styles.chipTxt, selectedWeight === variant.label && styles.chipTxtActive]}>
                          {variant.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {selectedCategory !== 'Accessories' && product?.variants && product.variants.length > 0 && (
                <View style={styles.divider} />
              )}

              <Text style={styles.cardTitle}>Quantity</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, selectedQuantity === 1 && styles.qtyBtnDisabled]}
                  onPress={() => setSelectedQuantity(q => Math.max(1, q - 1))}
                  disabled={selectedQuantity === 1}
                >
                  <Icon name="remove" size={18} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{selectedQuantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setSelectedQuantity(q => q + 1)}>
                  <Icon name="add" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Card: Features */}
            {Array.isArray(product?.features) && product.features.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Features</Text>
                {product.features.map((f, idx) => (
                  <View key={`${f}-${idx}`} style={styles.featureRow}>
                    <Icon name="check-circle" size={16} color={COLORS.lightGreenColor || COLORS.goldColor} />
                    <Text style={styles.featureTxt}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Card: Quick actions */}
            {/* {selectedCategory !== 'Accessories' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick Actions</Text>
                <View style={styles.quickRow}>
                  <TouchableOpacity style={styles.quickBtn} onPress={handleRefill}>
                    <Icon name="autorenew" size={18} color={COLORS.white} />
                    <Text style={styles.quickTxt}>Refill</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickBtn} onPress={handleNewConnection}>
                    <Icon name="person-add" size={18} color={COLORS.white} />
                    <Text style={styles.quickTxt}>New Connection</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickBtn} onPress={handleSpare}>
                    <Icon name="backup" size={18} color={COLORS.white} />
                    <Text style={styles.quickTxt}>Spare</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )} */}
          </>
        )}

        <View style={{ height: hp('10%') }} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>₹{totalPrice}</Text>
          {!!unitPrice && (
            <Text style={styles.priceUnit}>₹{unitPrice} / unit</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.ctaBtn, (!inStock || isLoadingProduct || productError) && styles.ctaBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!inStock || isLoadingProduct || productError}>
          <Icon name="add-shopping-cart" size={20} color={COLORS.white} />
          <Text style={styles.ctaTxt}>
            {isLoadingProduct ? 'Loading...' : !inStock ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -wp('1.5%'),
    right: -wp('1.5%'),
    backgroundColor: COLORS.error,
    minWidth: wp('4.5%'),
    height: wp('4.5%'),
    borderRadius: wp('2.25%'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('1%'),
  },
  badgeTxt: {
    color: COLORS.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },

  // Scroll + hero
  scrollPad: {
    paddingBottom: spacing.md,
  },
  heroWrap: {
    width: screenWidth,
    aspectRatio: 16 / 10,
    backgroundColor: COLORS.lightGrayOpacityColor || COLORS.verylightGrayColor,
  },
  heroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  heroTags: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    gap: wp('2%'),
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: wp('1.5%'),
    borderRadius: borderRadius.lg,
  },
  tagTxt: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.verylightGrayColor || COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  name: {
    fontSize: fontSize.lg,
    color: COLORS.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    marginTop: wp('2%'),
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  chip: {
    paddingVertical: wp('2%'),
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipTxt: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTxtActive: {
    color: COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.verylightGrayColor || COLORS.border,
    marginVertical: spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qtyBtn: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  qtyValue: {
    minWidth: wp('9%'),
    textAlign: 'center',
    fontSize: fontSize.md,
    fontWeight: '800',
    color: COLORS.text,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: wp('1.5%'),
  },
  featureTxt: {
    flex: 1,
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
  },

  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTxt: {
    marginTop: wp('1%'),
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: COLORS.white,
    textTransform: 'uppercase',
  },

  // Footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.verylightGrayColor || COLORS.border,
  },
  priceBlock: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: wp('0.5%'),
  },
  priceValue: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: fontSize.xl,
  },
  priceUnit: {
    fontSize: fontSize.xs,
    color: COLORS.mediumGray || COLORS.textSecondary,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: wp('4.5%'),
    borderRadius: borderRadius.md,
  },
  ctaBtnDisabled: {
    backgroundColor: COLORS.lightShadeBlue || '#9aa3b2',
  },
  ctaTxt: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: '900',
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.verylightGrayColor || COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});

export default ProductDetailsScreen;
