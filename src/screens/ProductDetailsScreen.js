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

        <View style={{ height: 80 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  // Scroll + hero
  scrollPad: {
    paddingBottom: 16,
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
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagTxt: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.verylightGrayColor || COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTxtActive: {
    color: COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.verylightGrayColor || COLORS.border,
    marginVertical: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  qtyValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  featureTxt: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTxt: {
    marginTop: 4,
    fontSize: 9,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.verylightGrayColor || COLORS.border,
  },
  priceBlock: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 22,
  },
  priceUnit: {
    fontSize: 11,
    color: COLORS.mediumGray || COLORS.textSecondary,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  ctaBtnDisabled: {
    backgroundColor: COLORS.lightShadeBlue || '#9aa3b2',
  },
  ctaTxt: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.verylightGrayColor || COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProductDetailsScreen;
