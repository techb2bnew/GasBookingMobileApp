import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, STRINGS } from '../constants';
import { removeFromCart, updateQuantity } from '../redux/slices/cartSlice';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';


const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { items, totalAmount, totalItems } = useSelector(state => state.cart);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [stockModalMessage, setStockModalMessage] = useState('');

  // Get available stock for a cart item
  const getAvailableStock = (item) => {
    if (!item || !item.weight) return 0;

    // First check agency variants stock
    if (item.AgencyInventory && item.AgencyInventory.length > 0) {
      const agencyInventory = item.AgencyInventory[0];
      if (agencyInventory.agencyVariants && agencyInventory.agencyVariants.length > 0) {
        const agencyVariant = agencyInventory.agencyVariants.find(av => av.label === item.weight);
        if (agencyVariant && agencyVariant.stock !== undefined) {
          return agencyVariant.stock;
        }
      }
    }

    // Fallback to general variants stock
    if (item.variants && item.variants.length > 0) {
      const variant = item.variants.find(v => v.label === item.weight);
      if (variant && variant.stock !== undefined) {
        return variant.stock;
      }
    }

    return 0;
  };

  // Get total quantity of this item in cart (excluding current item)
  const getOtherItemsQuantity = (currentItem) => {
    if (!currentItem?.id || !items || !Array.isArray(items)) return 0;
    
    return items
      .filter(cartItem => {
        // Exclude current item by comparing references or unique identifiers
        const itemProduct = cartItem?.product || cartItem;
        const isSameProduct = itemProduct?.id === currentItem.id && 
                              itemProduct?.weight === currentItem.weight;
        const isCurrentItem = cartItem === currentItem;
        return isSameProduct && !isCurrentItem;
      })
      .reduce((total, cartItem) => total + (cartItem.quantity || 0), 0);
  };

  const handleUpdateQuantity = (item, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(item);
      return;
    }

    // Check stock if increasing quantity
    if (newQuantity > item.quantity) {
      const availableStock = getAvailableStock(item);
      const otherItemsQuantity = getOtherItemsQuantity(item);
      const totalAfterUpdate = otherItemsQuantity + newQuantity;

      if (totalAfterUpdate > availableStock) {
        setStockModalMessage(`You can add maximum ${availableStock} units. Only ${availableStock} units are currently available.`);
        setIsStockModalVisible(true);
        return;
      }
    }

    // Update quantity if stock is available
    dispatch(updateQuantity({
      productId: item.id,
      quantity: newQuantity,
      weight: item.weight,
      category: item.category,
      type: item.type
    }));
  };

  const handleRemoveItem = (item) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(removeFromCart({
            productId: item.id,
            weight: item.weight,
            category: item.category,
            type: item.type
          })),
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    navigation.navigate('Checkout');
  };

  const renderCartItem = ({ item }) => {
    return (
      <View style={styles.cartItem}>
        {/* Product Image with Badge */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityBadgeText}>{item.quantity}</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <View style={styles.productTitleContainer}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName ? item.productName.charAt(0).toUpperCase() + item.productName.slice(1) : item.productName}
              </Text>
              <View style={styles.productTags}>
                {item.weight && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.weight}</Text>
                  </View>
                )}
                {item.category && (
                  <View style={[styles.tag, styles.categoryTag]}>
                    <Text style={styles.tagText}>{item.category}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>

          {/* Price and Quantity Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.priceContainer}>
              <Text style={styles.unitPrice}>${item.price}</Text>
              <Text style={styles.perUnit}>per unit</Text>
            </View>
            
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => handleUpdateQuantity(item, item.quantity - 1)}
                disabled={item.quantity <= 1}>
                <Ionicons name="remove" size={16} color={item.quantity <= 1 ? COLORS.textSecondary : COLORS.white} />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item, item.quantity + 1)}>
                <Ionicons name="add" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Price with Animation */}
          <View style={styles.totalRow}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Item Total</Text>
              <Text style={styles.itemTotal}>${item.price * item.quantity}</Text>
            </View>
            <View style={styles.savingsContainer}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.savingsText}>Added to cart</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };


  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="cart-outline" size={80} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Looks like you haven't added any items to your cart yet.{'\n'}
        Start shopping to fill it up!
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Main', {
          screen: 'Products',
        })}>
        <Ionicons name="storefront-outline" size={20} color={COLORS.white} style={styles.shopIcon} />
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{STRINGS.cart}</Text>
        <View style={styles.placeholder} />
      </View>

      {items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartContent}
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>${totalAmount}</Text>
              <Text style={styles.itemsCount}>{totalItems} items</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    paddingVertical: 5,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: wp('15%'),
  },
  cartContent: {
    padding: spacing.sm,
    paddingBottom: spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    marginRight: spacing.md,
    position: 'relative',
  },
  itemImage: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: borderRadius.md,
    backgroundColor: COLORS.lightGray,
  },
  quantityBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: wp('3%'),
    width: wp('6%'),
    height: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  quantityBadgeText: {
    color: COLORS.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  productTitleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: spacing.xs / 2,
  },
  productTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryTag: {
    backgroundColor: COLORS.success + '15',
  },
  tagText: {
    fontSize: fontSize.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  removeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: COLORS.error + '10',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unitPrice: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  perUnit: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
  },
  quantityButton: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityText: {
    marginHorizontal: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: wp('6%'),
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 1,
  },
  itemTotal: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingsText: {
    fontSize: fontSize.xs,
    color: COLORS.success,
    fontWeight: '500',
    marginLeft: spacing.xs / 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
  },
  emptyIconContainer: {
    marginBottom: spacing.xl,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shopIcon: {
    marginRight: spacing.sm,
  },
  shopButtonText: {
    color: COLORS.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
  },
  totalContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  itemsCount: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    minWidth: wp('35%'),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
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

export default CartScreen;

