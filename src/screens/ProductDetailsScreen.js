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
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { addToCart, updateQuantity } from '../redux/slices/cartSlice';
import { COLORS, STRINGS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiConfig';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';

const { width: screenWidth } = Dimensions.get('window');

const WEIGHTS = ['2kg', '5kg', '14.2kg', '19kg'];

const ProductDetailsScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { totalItems, items } = useSelector(state => state.cart);
  const { product: routeProduct = {} } = route.params || {};

  const [product, setProduct] = useState(routeProduct);
  const [productError, setProductError] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(routeProduct?.weight);
  const [selectedCategory] = useState(routeProduct?.category || 'LPG');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [stockModalMessage, setStockModalMessage] = useState('');

  // Initialize product data from route params
  useEffect(() => {
    if (routeProduct && Object.keys(routeProduct).length > 0) {
      setProduct(routeProduct);
      
      // Set selected weight from first variant if available
      if (routeProduct.variants && routeProduct.variants.length > 0) {
        setSelectedWeight(routeProduct.variants[0].label);
      }
      
    } else {
      setProductError('No product information available');
    }
  }, [routeProduct]);


  // Auto-play image slider for multiple images
  useEffect(() => {
    if (product?.images && product.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => 
          (prevIndex + 1) % product.images.length
        );
      }, 3000); // Change image every 3 seconds

      return () => clearInterval(interval);
    }
  }, [product?.images]);

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

  // Check if product is already in cart
  const isProductInCart = useMemo(() => {
    if (!product?.id || !items || !Array.isArray(items)) return false;
    
    return items.some(cartItem => {
      // Handle different cart item structures
      const itemProduct = cartItem?.product || cartItem;
      return itemProduct?.id === product.id && 
             itemProduct?.weight === selectedWeight;
    });
  }, [product?.id, items, selectedWeight]);

  // Track changes in quantity or weight
  useEffect(() => {
    if (isProductInCart && items && Array.isArray(items)) {
      // Check if current selection differs from what's in cart
      const cartItem = items.find(item => {
        const itemProduct = item?.product || item;
        return itemProduct?.id === product?.id && 
               itemProduct?.weight === selectedWeight;
      });
      
      if (cartItem) {
        const hasQuantityChange = cartItem.quantity !== selectedQuantity;
        setHasChanges(hasQuantityChange);
      } else {
        setHasChanges(true); // Different weight selected
      }
    } else {
      setHasChanges(false);
    }
  }, [isProductInCart, selectedQuantity, selectedWeight, items, product?.id]);

  // Get available stock for selected variant
  const getAvailableStock = () => {
    if (!product || !selectedWeight) return 0;

    // First check agency variants stock
    if (product.AgencyInventory && product.AgencyInventory.length > 0) {
      const agencyInventory = product.AgencyInventory[0];
      if (agencyInventory.agencyVariants && agencyInventory.agencyVariants.length > 0) {
        const agencyVariant = agencyInventory.agencyVariants.find(av => av.label === selectedWeight);
        if (agencyVariant && agencyVariant.stock !== undefined) {
          return agencyVariant.stock;
        }
      }
    }

    // Fallback to general variants stock
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.label === selectedWeight);
      if (variant && variant.stock !== undefined) {
        return variant.stock;
      }
    }

    return 0;
  };

  // Get quantity already in cart for this product and variant
  const getCartQuantity = () => {
    if (!product?.id || !items || !Array.isArray(items)) return 0;
    
    const cartItem = items.find(item => {
      const itemProduct = item?.product || item;
      return itemProduct?.id === product.id && 
             itemProduct?.weight === selectedWeight;
    });
    
    return cartItem ? cartItem.quantity : 0;
  };

  // --- Cart helpers ---
  const pushToCart = async (extra = {}) => {
    // Get selected agency ID from AsyncStorage
    const selectedAgencyId = await AsyncStorage.getItem('selectedAgencyId');
    
    const cartProduct = {
      ...product,
      weight: selectedWeight,
      category: selectedCategory,
      quantity: selectedQuantity,
      price: unitPrice, // price per unit
      ...extra,
    };
    
    console.log('Cart payload to be saved:', {
      product: cartProduct,
      quantity: selectedQuantity,
      agencyId: selectedAgencyId,
    });

    // If product is already in cart, update quantity instead of adding
    if (isProductInCart) {
      dispatch(updateQuantity({
        productId: product.id,
        quantity: selectedQuantity,
        weight: selectedWeight,
        category: selectedCategory,
        type: extra.type || 'default'
      }));
    } else {
      dispatch(addToCart({ product: cartProduct, quantity: selectedQuantity, agencyId: selectedAgencyId }));
    }
  };

  const handleAddToCart = async () => {
    console.log('Add to Cart clicked:', {
      isProductInCart,
      hasChanges,
      selectedQuantity,
      selectedWeight
    });

    // Check stock availability
    const availableStock = getAvailableStock();
    const cartQuantity = getCartQuantity();
    const totalRequestedQuantity = isProductInCart ? selectedQuantity : selectedQuantity + cartQuantity;

    console.log('Stock Check:', {
      availableStock,
      cartQuantity,
      selectedQuantity,
      totalRequestedQuantity
    });

    if (totalRequestedQuantity > availableStock) {
      setStockModalMessage(`You cannot add this quantity. Only ${availableStock} units are currently available.`);
      setIsStockModalVisible(true);
      return;
    }
    
    // Always call pushToCart - it will handle whether to add or update
    await pushToCart();
    navigation.navigate('Cart');
  };
  const handleRefill = async () => await pushToCart({ type: 'refill' });
  const handleNewConnection = async () => await pushToCart({ type: 'new_connection' });
  const handleSpare = async () => await pushToCart({ type: 'spare' });

  const inStock = product?.inStock ?? true;

  // Render hero image with slider
  const renderHeroImage = () => {
    const hasMultipleImages = product?.images && product.images.length > 1;
    const currentImage = product?.images?.[currentImageIndex] || product?.image;
    
    return (
      <View style={styles.heroWrap}>
        <Image 
          source={{ uri: currentImage }} 
          style={styles.heroImg} 
          resizeMode="contain" 
        />
        <View style={styles.heroOverlay} />
        
        {/* Image dots for multiple images */}
        {hasMultipleImages && (
          <View style={styles.heroImageDots}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.heroImageDot,
                  index === currentImageIndex && styles.heroActiveImageDot,
                ]}
              />
            ))}
          </View>
        )}
        
        <View style={styles.heroTags}>
          <View style={styles.tagPill}>
            <Icon name="local-gas-station" size={14} color={COLORS.white} />
            <Text style={styles.tagTxt}>{selectedCategory}</Text>
          </View>
          {selectedWeight && (
            <View style={styles.tagPill}>
              <Icon name="scale" size={14} color={COLORS.white} />
              <Text style={styles.tagTxt}>{selectedWeight}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {STRINGS?.productDetails || 'Product Details'}
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
        {/* Error State */}
        {productError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{productError}</Text>
          </View>
        )}

        {/* Product Content - Only show when no error */}
        {!productError && product && (
          <>
            {/* Hero Image with Slider */}
            {renderHeroImage()}

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
                <TouchableOpacity 
                  style={styles.qtyBtn}
                  onPress={() => {
                    const availableStock = getAvailableStock();
                    const cartQuantity = getCartQuantity();
                    const maxQuantity = isProductInCart 
                      ? availableStock 
                      : availableStock - cartQuantity;
                    const newQuantity = selectedQuantity + 1;
                    
                    if (newQuantity > maxQuantity) {
                      setStockModalMessage(`You can add maximum ${maxQuantity} units. Only ${availableStock} units are currently available.`);
                      setIsStockModalVisible(true);
                    } else {
                      setSelectedQuantity(newQuantity);
                    }
                  }}
                >
                  <Icon name="add" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              {(() => {
                const availableStock = getAvailableStock();
                const cartQuantity = getCartQuantity();
                const maxQuantity = isProductInCart 
                  ? availableStock 
                  : availableStock - cartQuantity;
                
                if (availableStock > 0) {
                  return (
                    <Text style={styles.stockInfo}>
                      Available Stock: {availableStock} units
                      {cartQuantity > 0 && ` (${cartQuantity} already in cart)`}
                    </Text>
                  );
                }
                return null;
              })()}
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
          <Text style={styles.priceValue}>${totalPrice}</Text>
          {!!unitPrice && (
            <Text style={styles.priceUnit}>${unitPrice} / unit</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.ctaBtn, 
            (!inStock || productError) && styles.ctaBtnDisabled,
            isProductInCart && !hasChanges && styles.ctaBtnInCart
          ]}
          onPress={handleAddToCart}
          disabled={!inStock || productError}>
          <Icon name="add-shopping-cart" size={20} color={COLORS.white} />
          <Text style={styles.ctaTxt}>
            {!inStock 
              ? 'Out of Stock' 
              : isProductInCart && !hasChanges
                ? 'Already in Cart'
                : 'Add to Cart'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stock Limit Modal */}
      <Modal
        visible={isStockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStockModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.stockModalContainer}>
            <View style={styles.stockModalHeader}>
              <Icon name="info" size={28} color={COLORS.primary} />
              <Text style={styles.stockModalTitle}>Stock Limit</Text>
            </View>
            <Text style={styles.stockModalMessage}>{stockModalMessage}</Text>
            <TouchableOpacity
              style={styles.stockModalButton}
              onPress={() => setIsStockModalVisible(false)}>
              <Text style={styles.stockModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    position: 'relative',
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
  heroImageDots: {
    position: 'absolute',
    bottom: wp('3%'),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('1%'),
  },
  heroImageDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  heroActiveImageDot: {
    backgroundColor: COLORS.white,
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
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
  stockInfo: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
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
    backgroundColor: COLORS.blue,
    paddingVertical: spacing.sm,
    paddingHorizontal: wp('4.5%'),
    borderRadius: borderRadius.md,
  },
  ctaBtnDisabled: {
    backgroundColor: COLORS.lightShadeBlue || '#9aa3b2',
  },
  ctaBtnInCart: {
    backgroundColor: COLORS.primary ,
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
  // Stock Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockModalContainer: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  stockModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stockModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  stockModalMessage: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: fontSize.md * 1.5,
  },
  stockModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    minWidth: wp('25%'),
    alignItems: 'center',
  },
  stockModalButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});

export default ProductDetailsScreen;
