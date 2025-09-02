import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, STRINGS } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { addToCart } from '../redux/slices/cartSlice';
import MenuDrawer from '../components/MenuDrawer';

const { width: screenWidth } = Dimensions.get('window');

const ProductsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products } = useSelector(state => state.products);
  const { totalItems, totalAmount } = useSelector(state => state.cart);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const carouselRef = useRef(null);

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
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter(item => item.category === selectedCategory);
  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1 }));
    // Alert.alert('Success', `${product.name} added to cart`);
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

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
        
        {item.weight && (
          <View style={styles.weightInfo}>
            <Icon name="scale" size={14} color={COLORS.primary} />
            <Text style={styles.weightText}>{item.weight}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => handleAddToCart(item)}
          disabled={!item.inStock}>
          <View style={styles.buttonContent}>
            <Icon name="add-shopping-cart" size={14} color={COLORS.white} />
            <Text style={styles.addToCartText}>
              {item.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {item.category !== 'Accessories' && (
          <View style={styles.quickOptions}>
            <TouchableOpacity
              style={styles.quickOption}
              onPress={() => handleRefillCylinder(item)}
              disabled={!item.inStock}>
              <Text style={styles.quickOptionText}>Refill</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickOption}
              onPress={() => handleNewConnection(item)}
              disabled={!item.inStock}>
              <Text style={styles.quickOptionText}>New</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickOption}
              onPress={() => handleSpareCylinder(item)}
              disabled={!item.inStock}>
              <Text style={styles.quickOptionText}>Spare</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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


        {/* Products Grid */}
        <View style={styles.productsSection}>
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
            contentContainerStyle={styles.productsContent}
          />
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
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 15,
    borderRadius: 12,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
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
    fontSize: 12,
    marginLeft: 4,
  },
  cartButton: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 25,
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
    fontSize: 13,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  content: {
    flex: 1,
  },
  carouselContainer: {
    height: 200,
    marginBottom: 0,
  },
  carousel: {
    flex: 1,
  },
  carouselItem: {
    width: screenWidth,
    height: 200,
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
    padding: 20,
  },
  carouselTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  carouselSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.9,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    opacity: 0.5,
    marginHorizontal: 4,
  },
  activeDot: {
    opacity: 1,
    backgroundColor: COLORS.primary,
  },
  productsSection: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  productsContent: {
    paddingBottom: 100, 
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cartInfo: {
    flex: 1,
  },
  cartItemsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  cartTotalText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    width: (screenWidth - 45) / 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  weightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weightText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  productDetail: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  productFooter: {
    flexDirection: 'column',
    marginTop: 10,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 5,
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
    fontSize: 14,
    marginLeft: 6,
  },
  quickOptions: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 5,
  },
  quickOption: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  quickOptionText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 10,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
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
    paddingVertical: 10,
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
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    transform: [{ scale: 1.05 }],
  },
  categoryText: { 
    fontSize: 12, 
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

