import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, STRINGS } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { addToCart } from '../redux/slices/cartSlice';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';
import MenuDrawer from '../components/MenuDrawer';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

const ProductsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { totalItems, totalAmount } = useSelector(state => state.cart);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [apiProducts, setApiProducts] = useState([]);
  const carouselRef = useRef(null);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(
        `${STRINGS.API_BASE_URL}/api/products/status/active`,
        { headers }
      );

      console.log('Products API Response:', response.data);
      console.log('Products Data Structure:', response.data.data);
      console.log('Products Array:', response.data.data.products);
      console.log('First Product Sample:', response.data.data.products?.[0]);
      console.log('Categories Available:', [...new Set(response.data.data.products?.map(p => p.category) || [])]);

      if (response.data && response.data.success) {
        const products = response.data.data.products;
        if (products && Array.isArray(products)) {
          setApiProducts(products);
        } else {
          setProductsError('Invalid products data received');
        }
      } else {
        setProductsError(response.data?.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError('Failed to load products. Please try again.');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch products when component mounts and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
    }, [])
  );

  // Use only API products - no static data fallback
  const allProducts = apiProducts;

  // Carousel banner data
  const carouselData = [
    {
      id: '1',
      image: 'https://media.istockphoto.com/id/2065176225/photo/a-truck-equipped-with-a-unit-for-transporting-liquefied-household-gas-for-delivery-to-the.jpg?s=2048x2048&w=is&k=20&c=pzxFHnc77bQJDd85rqlsvj2_8uCCKWehlpQtSvtiI84=',
      title: 'Special Offer',
      subtitle: 'Get 10% off on first order'
    },
    {
      id: '2',
      image: 'https://media.istockphoto.com/id/1207561811/photo/colleagues-loading-gas-cylinder-on-to-tanker-truck.jpg?s=1024x1024&w=is&k=20&c=By3SZrAZMRCRhosNypjce8FyS-cjHSWyr_3M1y3Ryt8=',
      title: 'Fast Delivery',
      subtitle: 'Same day delivery available'
    },
    {
      id: '3',
      image: 'https://media.istockphoto.com/id/1082712970/photo/filling-the-domestic-gas-tank-with-lpg.jpg?s=1024x1024&w=is&k=20&c=XRHt393LbnMkbFKCwp8nGIb7qzzEUAaXG4-hv18J5qc=',
      title: '24x7 Support',
      subtitle: 'We are here to help you'
    }
  ];
  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'All'
    ? allProducts
    : allProducts.filter(item => {
      console.log('Filtering item:', item.productName, 'Category:', item.category, 'Selected:', selectedCategory);
      return item.category === selectedCategory;
    });

  const handleAddToCart = (product) => {
    // Extract first variant data for cart
    const firstVariant = product?.variants?.[0];
    console.log('Original Product:', product);
    console.log('First Variant:', firstVariant);

    if (firstVariant) {
      const cartProduct = {
        ...product,
        weight: firstVariant.label,
        price: firstVariant.price,
        stock: firstVariant.stock,
        inStock: firstVariant.stock > 0
      };
      console.log('Cart Product:', cartProduct);
      dispatch(addToCart({ product: cartProduct, quantity: 1 }));
    } else {
      console.log('No variants found for product:', product);
    }
    // Alert.alert('Success', `${product.productName} added to cart`);
  };

  const handleRefillCylinder = (product) => {
    dispatch(addToCart({ product, quantity: 1, type: 'refill' }));
    // Alert.alert('Success', `${product.name} refill request added to cart`);
  };

  const handleNewConnection = (product) => {
    dispatch(addToCart({ product, quantity: 1, type: 'new_connection' }));
    // Alert.alert('Success', `${product.name} new connection request added to cart`);
  };

  const handleSpareCylinder = (product) => {
    dispatch(addToCart({ product, quantity: 1, type: 'spare' }));
    // Alert.alert('Success', `${product.name} spare cylinder request added to cart`);
  };

  const renderCarouselItem = ({ item, index }) => (
    <View style={styles.carouselItem}>
      <Image source={{ uri: item.image }} style={styles.carouselImage} />
      <View style={styles.carouselOverlay}>
        <Text style={styles.carouselTitle}>{item.title}</Text>
        <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const renderCarouselDots = () => (
    <View style={styles.carouselDots}>
      {carouselData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentCarouselIndex && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );

  const renderCategoryTabs = () => (
    <View style={styles.categoryTabs}>
      {['All', 'LPG', 'Accessories'].map(cat => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.categoryButton,
            selectedCategory === cat && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory(cat)}>
          <Text
            style={[
              styles.categoryText,
              selectedCategory === cat && styles.categoryTextActive,
            ]}>
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProductItem = ({ item }) => {
    // console.log("Rendering Product Item:", item);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}>
        <Image source={{ uri: item?.images[0] }} style={styles.productImage} />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item?.productName}</Text>
          <Text style={styles.productPrice}>₹{item?.variants?.[0]?.price || 'N/A'}</Text>

          {item?.variants?.[0]?.label && (
            <View style={styles.weightInfo}>
              <Icon name="scale" size={14} color={COLORS.primary} />
              <Text style={styles.weightText}>{item.variants[0].label}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => {
              // console.log("Add to Cart pressed:", item); 
              handleAddToCart(item);
            }}
            disabled={!(item?.variants?.[0]?.stock > 0)}>
            <View style={styles.buttonContent}>
              <Icon name="add-shopping-cart" size={14} color={COLORS.white} />
              <Text style={styles.addToCartText}>
                {(item?.variants?.[0]?.stock > 0) ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* {item.category !== 'Accessories' && (
            <View style={styles.quickOptions}>
              <TouchableOpacity
                style={styles.quickOption}
                onPress={() => {
                  console.log("Refill pressed:", item); // ✅ log
                  handleRefillCylinder(item);
                }}
                disabled={!(item?.variants?.[0]?.stock > 0)}>
                <Text style={styles.quickOptionText}>Refill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickOption}
                onPress={() => {
                  console.log("New Connection pressed:", item); // ✅ log
                  handleNewConnection(item);
                }}
                disabled={!(item?.variants?.[0]?.stock > 0)}>
                <Text style={styles.quickOptionText}>New</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickOption}
                onPress={() => {
                  console.log("Spare pressed:", item); // ✅ log
                  handleSpareCylinder(item);
                }}
                disabled={!(item?.variants?.[0]?.stock > 0)}>
                <Text style={styles.quickOptionText}>Spare</Text>
              </TouchableOpacity>
            </View>
          )} */}
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMenuVisible(true)}>
                <Icon name="menu" size={26} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{STRINGS.gasBooking}</Text>
                <Text style={styles.subtitle}>Fast & Safe Delivery</Text>
              </View>
            </View>

            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.addressButton}
                onPress={() => navigation.navigate('AddAddress')}>
                <Icon name="location-on" size={20} color={COLORS.primary} />
                <Text style={styles.addressButtonText}>Address</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => navigation.navigate('Cart')}>
                <Icon name="shopping-cart" size={22} color={COLORS.white} />
                {totalItems > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carousel Banner */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={carouselRef}
            data={carouselData}
            renderItem={renderCarouselItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentCarouselIndex(index);
            }}
            style={styles.carousel}
          />
          {renderCarouselDots()}
        </View>

        {/* Category Filter Tabs */}
        {renderCategoryTabs()}

        {/* Products Section with Loading and Error States */}
        <View style={styles.productsSection}>
          {isLoadingProducts ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : productsError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{productsError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchProducts}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Products Header with Refresh */}
              <View style={styles.productsHeader}>
                <Text style={styles.productsTitle}>Available Products</Text>
                {/* <TouchableOpacity style={styles.refreshProductsButton} onPress={fetchProducts}>
                  <Text style={styles.refreshProductsButtonText}>🔄</Text>
                </TouchableOpacity> */}
              </View>

              {/* Products Grid */}
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.productRow}
                scrollEnabled={false}
                contentContainerStyle={styles.productsContent}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Summary */}
      {totalItems > 0 && (
        <View style={styles.floatingCart}>
          <View style={styles.cartSummary}>
            <View style={styles.cartInfo}>
              <Text style={styles.cartItemsText}>{totalItems} items</Text>
              <Text style={styles.cartTotalText}>₹{totalAmount}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => navigation.navigate('Checkout')}>
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu Drawer */}
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: 'transparent',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  headerGradient: {
    backgroundColor: COLORS.primary,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: wp('5%'),
    borderBottomRightRadius: wp('5%'),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: wp('2%'),
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: wp('0.5%'),
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addressButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: spacing.md,
    paddingVertical: wp('2%'),
    borderRadius: wp('5%'),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addressButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
    marginLeft: wp('1%'),
  },
  cartButton: {
    backgroundColor: COLORS.secondary,
    padding: spacing.sm,
    borderRadius: wp('6.25%'),
    position: 'relative',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cartButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: fontSize.md,
  },
  cartBadge: {
    position: 'absolute',
    top: -wp('1.25%'),
    right: -wp('1.25%'),
    backgroundColor: COLORS.error,
    borderRadius: wp('2.5%'),
    minWidth: wp('5%'),
    height: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },

  content: {
    flex: 1,
  },
  carouselContainer: {
    height: hp('25%'),
    marginBottom: 0,
  },
  carousel: {
    flex: 1,
  },
  carouselItem: {
    width: screenWidth,
    height: hp('25%'),
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.lg,
  },
  carouselTitle: {
    color: COLORS.white,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: wp('1.25%'),
  },
  carouselSubtitle: {
    color: COLORS.white,
    fontSize: fontSize.sm,
    opacity: 0.9,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
  },
  dot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: COLORS.white,
    opacity: 0.5,
    marginHorizontal: wp('1%'),
  },
  activeDot: {
    opacity: 1,
    backgroundColor: COLORS.primary,
  },
  productsSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  productsContent: {
    paddingBottom: hp('12.5%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productsTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  refreshProductsButton: {
    padding: wp('2%'),
    borderRadius: borderRadius.md,
    backgroundColor: COLORS.background,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshProductsButtonText: {
    fontSize: fontSize.xl,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cartInfo: {
    flex: 1,
  },
  cartItemsText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: wp('0.5%'),
  },
  cartTotalText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp('6.25%'),
    paddingVertical: spacing.md,
    borderRadius: wp('2.5%'),
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    padding: wp('2%'),
    width: (screenWidth - 35) / 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: hp('15%'),
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    resizeMode:"contain"
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: wp('1.25%'),
    lineHeight: fontSize.lg,
  },
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: wp('2%'),
  },
  productDescription: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: wp('2%'),
    lineHeight: fontSize.lg,
  },
  weightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weightText: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: wp('1%'),
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: wp('2%'),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  metaText: {
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('1%'),
    borderRadius: borderRadius.md,
  },
  categoryTagText: {
    fontSize: fontSize.xs,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  productDetail: {
    fontSize: fontSize.sm,
    color: COLORS.text,
    marginBottom: wp('1.25%'),
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp('1%'),
    gap: wp('1.5%'),
  },
  featureText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  productFooter: {
    flexDirection: 'column',
    marginTop: spacing.sm,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: wp('1.25%'),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: fontSize.sm,
    marginLeft: wp('1.5%'),
  },
  quickOptions: {
    flexDirection: 'row',
    gap: wp('1%'),
    marginTop: wp('1.25%'),
  },
  quickOption: {
    backgroundColor: COLORS.secondary,
    paddingVertical: wp('2%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('1%'),
    flex: 1,
    alignItems: 'center',
  },
  quickOptionText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: fontSize.xs,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    backgroundColor: COLORS.white,
    justifyContent: "space-evenly",
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButton: {
    paddingVertical: wp('1.25%'),
    paddingHorizontal: spacing.sm,
    borderRadius: wp('6.25%'),
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    minWidth: wp('22.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp('1.25%'),
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default ProductsScreen;

