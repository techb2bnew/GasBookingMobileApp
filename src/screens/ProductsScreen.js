import React, {useState, useRef, useEffect} from 'react';
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
  Modal,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {COLORS, STRINGS} from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {setProducts, updateProductAvailability, updateGlobalProductStatus, clearRefreshFlag} from '../redux/slices/productSlice';
import {wp, hp, fontSize, spacing, borderRadius} from '../utils/dimensions';
import MenuDrawer from '../components/MenuDrawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiConfig';
import { useAgencies } from '../hooks/useAgencies';
import { useSocket } from '../contexts/SocketContext';
import { testSocketConnection, testProductAvailabilityEvent } from '../utils/socketTest';
import socketService from '../utils/socketService';

const {width: screenWidth} = Dimensions.get('window');

const ProductsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {totalItems, totalAmount} = useSelector(state => state.cart);
  const {products: reduxProducts, needsRefresh} = useSelector(state => state.products);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [apiProducts, setApiProducts] = useState([]);
  const [productImageIndices, setProductImageIndices] = useState({});
  const [isAgencyModalVisible, setIsAgencyModalVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [processedEvents, setProcessedEvents] = useState(new Set());
  const carouselRef = useRef(null);
  const carouselIntervalRef = useRef(null);

  // Use Redux-based agencies management
  const {
    agencies,
    selectedAgency,
    selectedAgencyId,
    isLoading: isLoadingAgencies,
    error: agenciesError,
    fetchAgencies,
    selectAgency,
    hasAgencies,
    hasSelectedAgency
  } = useAgencies();

  // Socket context for real-time updates
  const { socket, isConnected } = useSocket();

  // Fetch products for selected agency
  const fetchProducts = async agencyId => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);

      const response = await apiClient.get(`/api/products`, {
        params: {agencyId},
      });

      console.log('=== PRODUCTS API RESPONSE ===');
      console.log('Agency ID Used:', agencyId);
      console.log('Full Response:', response);
      console.log('Response Data:', response.data);
      console.log('Success Status:', response.data?.success);
      console.log('Products Data Structure:', response.data?.data);
      console.log('Products Array:', response.data?.data?.products);
      console.log('Products Count:', response.data?.data?.products?.length);
      console.log('First Product Sample:', response.data?.data?.products?.[0]);
      console.log('Categories Available:', [
        ...new Set(response.data?.data?.products?.map(p => p.category) || []),
      ]);
      console.log('==============================');

      if (response.data && response.data.success) {
        const products = response.data.data.products;
        if (products && Array.isArray(products)) {
          setApiProducts(products);
          // Store products in Redux for use in other screens and real-time updates
          dispatch(setProducts(products));
          console.log('📦 Products stored in Redux:', products.length);
        } else {
          setProductsError('Invalid products data received');
        }
      } else {
        setProductsError(response.data?.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.log('=== PRODUCTS API ERROR ===');
      console.error('Error fetching products:', error);
      console.log('Error Response:', error.response?.data);
      console.log('Error Status:', error.response?.status);
      console.log('==========================');
      setProductsError('Failed to load products. Please try again.');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch agencies is now handled by the useAgencies hook

  // Fetch agencies when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchAgencies();
    }, [fetchAgencies]),
  );

  // Fetch products when selected agency changes
  useEffect(() => {
    if (selectedAgencyId) {
      console.log('🔄 Selected agency changed, fetching products for:', selectedAgencyId);
      fetchProducts(selectedAgencyId);
      // Clear processed events when agency changes
      setProcessedEvents(new Set());
      
      // Join the specific agency room for real-time updates
      if (socket && isConnected) {
        console.log('🏢 Joining agency room for real-time updates:', selectedAgencyId);
        socketService.joinAgencyRoom(selectedAgencyId);
      }
    } else {
      console.log('⚠️ No agency selected yet');
      setApiProducts([]);
    }
    
    // Cleanup function to leave agency room when component unmounts or agency changes
    return () => {
      if (selectedAgencyId && socket && isConnected) {
        console.log('🏢 Leaving agency room:', selectedAgencyId);
        socketService.leaveAgencyRoom(selectedAgencyId);
      }
    };
  }, [selectedAgencyId, socket, isConnected]);

  // Auto-play image slider for products with multiple images
  useEffect(() => {
    const interval = setInterval(() => {
      setProductImageIndices(prevIndices => {
        const newIndices = {};
        apiProducts.forEach(product => {
          if (product.images && product.images.length > 1) {
            const currentIndex = prevIndices[product.id] || 0;
            newIndices[product.id] = (currentIndex + 1) % product.images.length;
          }
        });
        return newIndices;
      });
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [apiProducts]);

  // Listen for real-time product availability changes
  useEffect(() => {
    if (!socket || !isConnected || !selectedAgencyId) return;

    const handleProductAvailabilityChange = (data) => {

      
      // Create a unique event ID to prevent duplicate processing
      const eventId = `${data.productId}-${data.agencyId}-${data.isActive}-${Date.now()}`;
      
      // Check if this event was already processed
      if (processedEvents.has(eventId)) {
        console.log('🔄 ProductsScreen: Event already processed, skipping...');
        return;
      }
      
      // Add to processed events
      setProcessedEvents(prev => new Set([...prev, eventId]));
      
      // Check if this change affects the currently selected agency
      if (data.agencyId === selectedAgencyId) {
        console.log('🔄 ProductsScreen: Product availability change affects current agency, updating...');
        
        // Dispatch to Redux to update the product list
        dispatch(updateProductAvailability(data));
        
        // Force UI update
        setForceUpdate(prev => prev + 1);
        
        // If product was activated and not in current list, trigger a fresh fetch
        if (data.isActive && !reduxProducts.find(p => p.id === data.productId)) {
          console.log('🔄 ProductsScreen: Product was activated but not in list, fetching fresh products...');
          setTimeout(() => {
            fetchProducts(selectedAgencyId);
          }, 500);
        }
      } else {
        console.log('🔄 ProductsScreen: Product availability change does not affect current agency, ignoring...');
      }
    };

    // Listen for product availability changes
    socket.on('product:availability-changed', handleProductAvailabilityChange);

    // Cleanup listener on unmount or when dependencies change
    return () => {
      if (socket) {
        socket.off('product:availability-changed', handleProductAvailabilityChange);
      }
    };
  }, [socket, isConnected, selectedAgencyId, dispatch]);

  // Listen for global product status changes (admin action)
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleGlobalProductStatusChange = (data) => {
      console.log('🌍 ProductsScreen: Global product status changed:', data);
      console.log('🌍 Product ID:', data.productId);
      console.log('🌍 Product Name:', data.productName);
      console.log('🌍 Status:', data.status);
      console.log('🌍 Affected Agencies:', data.affectedAgencies);
      console.log('🌍 Current selected agency:', selectedAgencyId);
      console.log('🌍 Current products count:', allProducts.length);
      
      // Dispatch to Redux to update global product status
      dispatch(updateGlobalProductStatus(data));
      
      // Force UI update
      setForceUpdate(prev => prev + 1);
      
      console.log('🌍 ProductsScreen: Global status change handled');
    };

    // Listen for global product status changes
    socket.on('product:global-status-changed', handleGlobalProductStatusChange);

    // Cleanup listener on unmount or when dependencies change
    return () => {
      if (socket) {
        socket.off('product:global-status-changed', handleGlobalProductStatusChange);
      }
    };
  }, [socket, isConnected, dispatch]);

  // Handle needsRefresh flag from Redux
  useEffect(() => {
    if (needsRefresh && selectedAgencyId) {
      console.log('🔄 ProductsScreen: needsRefresh flag detected, fetching fresh products...');
      fetchProducts(selectedAgencyId);
      dispatch(clearRefreshFlag());
    }
  }, [needsRefresh, selectedAgencyId, dispatch]);

  // Test socket connection when socket is available
  useEffect(() => {
    if (socket && isConnected) {
      console.log('🧪 Testing socket connection...');
      testSocketConnection(socket);
    }
  }, [socket, isConnected]);

  // Use Redux products if available, otherwise fallback to API products
  // Ensure we always have an array to prevent undefined errors
  // If Redux products is empty array, use it (don't fallback to API products)
  const allProducts = reduxProducts !== undefined ? reduxProducts : (apiProducts || []);
  
  // Debug logging


  // Carousel banner data
  const carouselData = [
    {
      id: '1',
      image:
        'https://media.istockphoto.com/id/2065176225/photo/a-truck-equipped-with-a-unit-for-transporting-liquefied-household-gas-for-delivery-to-the.jpg?s=2048x2048&w=is&k=20&c=pzxFHnc77bQJDd85rqlsvj2_8uCCKWehlpQtSvtiI84=',
      title: 'Special Offer',
      subtitle: 'Get 10% off on first order',
    },
    {
      id: '2',
      image:
        'https://media.istockphoto.com/id/1207561811/photo/colleagues-loading-gas-cylinder-on-to-tanker-truck.jpg?s=1024x1024&w=is&k=20&c=By3SZrAZMRCRhosNypjce8FyS-cjHSWyr_3M1y3Ryt8=',
      title: 'Fast Delivery',
      subtitle: 'Same day delivery available',
    },
    {
      id: '3',
      image:
        'https://media.istockphoto.com/id/1082712970/photo/filling-the-domestic-gas-tank-with-lpg.jpg?s=1024x1024&w=is&k=20&c=XRHt393LbnMkbFKCwp8nGIb7qzzEUAaXG4-hv18J5qc=',
      title: '24x7 Support',
      subtitle: 'We are here to help you',
    },
  ];
  // Auto-play carousel banner
  useEffect(() => {
    if (carouselData.length > 1) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentCarouselIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % carouselData.length;
          // Scroll to next slide
          if (carouselRef.current) {
            carouselRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          }
          return nextIndex;
        });
      }, 4000); // Change slide every 4 seconds
    }

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [carouselData.length]);
  // Filter products based on selected category
  const filteredProducts =
    selectedCategory === 'All'
      ? allProducts
      : allProducts.filter(item => {
          if (!item || !item.category) return false;
          console.log(
            'Filtering item:',
            item.productName,
            'Category:',
            item.category,
            'Selected:',
            selectedCategory,
          );
          // Convert both to lowercase for comparison
          const itemCategory = item.category?.toLowerCase();
          const selectedCategoryLower = selectedCategory.toLowerCase();
          return itemCategory === selectedCategoryLower;
        });

  const renderCarouselItem = ({item, index}) => (
    <View style={styles.carouselItem}>
      <Image source={{uri: item.image}} style={styles.carouselImage} />
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

  const renderCategoryTabs = () => {
    // Get unique categories from API products
    const availableCategories = [
      'All',
      ...new Set(
        apiProducts.map(
          product =>
            product.category?.charAt(0).toUpperCase() +
            product.category?.slice(1).toLowerCase(),
        ),
      ),
    ];

    return (
      <View style={styles.categoryTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
          style={styles.categoryScrollView}>
          {availableCategories.map(cat => (
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
        </ScrollView>
      </View>
    );
  };

  const renderProductImage = item => {
    if (!item || !item.images || !Array.isArray(item.images) || item.images.length === 0) {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{uri: 'https://via.placeholder.com/150x150?text=No+Image'}}
            style={styles.productImage}
          />
        </View>
      );
    }
    
    const currentImageIndex = productImageIndices[item.id] || 0;
    const hasMultipleImages = item.images && item.images.length > 1;

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{uri: item.images[currentImageIndex]}}
          style={styles.productImage}
        />
      </View>
    );
  };

  const renderProductItem = ({item}) => {
    // console.log("Rendering Product Item:", item);
    
    // Safety check for undefined item
    if (!item) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', {product: item})}>
        {renderProductImage(item)}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item?.productName
              ? item.productName.charAt(0).toUpperCase() +
                item.productName.slice(1)
              : item?.productName || 'Unknown Product'}
          </Text>
          <Text style={styles.weightText}>
            Starting at{' '}
            <Text style={styles.priceText}>
              ₹{item?.variants?.[0]?.price || 'N/A'}
            </Text>
          </Text>

          {item?.variants?.[0]?.label && (
            <View style={styles.weightInfo}>
              <Icon name="scale" size={14} color={COLORS.primary} />
              <Text style={styles.weightText}>
                Variants: {item.variants.length}
              </Text>
            </View>
          )}

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

            {/* <View style={styles.headerButtons}>
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
            </View> */}
            <View style={styles.agencySelectorContainer}>
              <TouchableOpacity
                style={styles.agencySelector}
                onPress={() => {
                  console.log('*** AGENCY MODAL TRIGGERED ***', agencies.length, isAgencyModalVisible);
                  setIsAgencyModalVisible(true);
                }}
                disabled={isLoadingAgencies}>
                <Icon name="store" size={20} color={COLORS.primary} />
                <Text style={styles.agencySelectorText} numberOfLines={1}>
                  {isLoadingAgencies
                    ? 'Loading agencies...'
                    : agencies.find(a => a.id === selectedAgencyId)?.name ||
                      'Select agency'}
                </Text>
                <Icon
                  name={'expand-more'}
                  size={20}
                  color={COLORS.textSecondary}
                />
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
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => {
              event.persist();
              const index = Math.round(
                event.nativeEvent.contentOffset.x / screenWidth,
              );
              setCurrentCarouselIndex(index);
            }}
            onScrollBeginDrag={() => {
              // Pause auto-play when user starts scrolling
              if (carouselIntervalRef.current) {
                clearInterval(carouselIntervalRef.current);
              }
            }}
            onScrollEndDrag={() => {
              // Resume auto-play after user stops scrolling
              if (carouselData.length > 1) {
                carouselIntervalRef.current = setInterval(() => {
                  setCurrentCarouselIndex(prevIndex => {
                    const nextIndex = (prevIndex + 1) % carouselData.length;
                    if (carouselRef.current) {
                      carouselRef.current.scrollToIndex({
                        index: nextIndex,
                        animated: true,
                      });
                    }
                    return nextIndex;
                  });
                }, 4000);
              }
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
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchProducts}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchProducts}>
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
                data={filteredProducts || []}
                renderItem={renderProductItem}
                keyExtractor={item => item?.id || Math.random().toString()}
                numColumns={3}
                columnWrapperStyle={styles.productRow}
                scrollEnabled={false}
                contentContainerStyle={styles.productsContent}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Agency Picker Modal */}
      <Modal
        visible={isAgencyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAgencyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.agencyModalContent}>
            <View style={styles.agencyModalHeader}>
              <Text style={styles.agencyModalTitle}>Select Agency</Text>
              <TouchableOpacity 
                onPress={() => setIsAgencyModalVisible(false)}
                style={{padding: 5}}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {agencies.length > 0 ? (
              <ScrollView 
                style={styles.agencyList}
                showsVerticalScrollIndicator={true}
                bounces={true}
                scrollEnabled={true}>
                {agencies.map(agency => (
                  <TouchableOpacity
                    key={agency.id}
                    style={[
                      styles.agencyCard,
                      agency.id === selectedAgencyId && styles.agencyCardSelected
                    ]}
                    onPress={async () => {
                      setIsAgencyModalVisible(false);
                      if (agency.id !== selectedAgencyId) {
                        // Use the selectAgency function from hook
                        await selectAgency(agency);
                        await fetchProducts(agency.id);
                      }
                    }}>
                    <View style={styles.agencyCardContent}>
                      {/* Agency Image - Full Width */}
                      <View style={styles.agencyImageContainerFull}>
                        <Image
                          source={{uri: agency.profileImage || 'https://via.placeholder.com/150x100'}}
                          style={styles.agencyImageFull}
                        />
                      </View>
                      
                      {/* Agency Details - Below Image */}
                      <View style={styles.agencyDetailsFull}>
                        <View style={styles.agencyNameContainerFull}>
                          <Text style={[
                            styles.agencyNameFull,
                            agency.id === selectedAgencyId && styles.agencyNameSelected
                          ]} numberOfLines={1}>
                            {agency.name}
                          </Text>
                        </View>
                        
                        {/* Contact Info */}
                        {agency.phone && (
                          <View style={styles.agencyInfoRowCompact}>
                            <Icon name="phone" size={14} color={COLORS.primary} />
                            <Text style={styles.agencyInfoTextCompact} numberOfLines={1}>
                              {agency.phone}
                            </Text>
                          </View>
                        )}
                        
                        {agency.email && (
                          <View style={styles.agencyInfoRowCompact}>
                            <Icon name="email" size={14} color={COLORS.primary} />
                            <Text style={styles.agencyInfoTextCompact} numberOfLines={1}>
                              {agency.email}
                            </Text>
                          </View>
                        )}
                        
                        {/* Address Info */}
                        <View style={styles.agencyInfoRowCompact}>
                          <Icon name="place" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.agencyInfoTextCompact} numberOfLines={2}>
                            {agency.address}, {agency.city} - {agency.pincode}
                          </Text>
                        </View>
                        
                        {agency.landmark && (
                          <View style={styles.agencyInfoRowCompact}>
                            <Icon name="pin-drop" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.agencyInfoTextCompact} numberOfLines={1}>
                              Near: {agency.landmark}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyAgencyState}>
                <Text style={styles.emptyAgencyText}>
                  {isLoadingAgencies ? 'Loading agencies...' : 'No agencies available'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Cart Summary */}
      {/* {totalItems > 0 && (
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
      )} */}

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
    shadowOffset: {width: 0, height: 3},
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
    shadowOffset: {width: 0, height: 2},
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
  agencySelectorContainer: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  agencySelector: {
    backgroundColor: COLORS.white,
    paddingHorizontal: spacing.md,
    paddingVertical: wp('2%'),
    borderRadius: wp('5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    minWidth: wp('40%'),
    maxWidth: wp('50%'),
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  agencySelectorText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
    flex: 1,
  },
  agencyDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: wp('2.5%'),
    marginTop: wp('1%'),
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  agencyModalContent: {
    backgroundColor: COLORS.white,
    width: wp('90%'),
    height: hp('70%'),
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  agencyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  agencyModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  agencyList: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  agencyCard: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  agencyCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    backgroundColor: COLORS.subtle,
  },
  agencyCardContent: {
    padding: 0,
  },
  agencyImageContainerFull: {
    height: hp('15%'),
    backgroundColor: COLORS.background,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  agencyImageFull: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  agencyDetailsFull: {
    padding: spacing.md,
  },
  agencyNameContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  agencyNameFull: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  agencyInfoRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 1,
  },
  agencyInfoTextCompact: {
    fontSize: fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: fontSize.sm,
  },
  agencyNameSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  emptyAgencyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyAgencyText: {
    fontSize: fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cartButton: {
    backgroundColor: COLORS.secondary,
    padding: spacing.sm,
    borderRadius: wp('6.25%'),
    position: 'relative',
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: -2},
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
    shadowOffset: {width: 0, height: 2},
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
    justifyContent: 'flex-start',
    marginBottom: spacing.sm,
    paddingHorizontal: wp('1%'),
    gap: wp('4%'),
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: borderRadius.md,
    padding: wp('1.5%'),
    width: (screenWidth - 60) / 3, // Adjusted for gap spacing
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  productImage: {
    width: '100%',
    height: hp('12%'),
    borderRadius: borderRadius.md,
    resizeMode: 'contain',
  },
  imageDots: {
    position: 'absolute',
    bottom: wp('1%'),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageDot: {
    width: wp('1.5%'),
    height: wp('1.5%'),
    borderRadius: wp('0.75%'),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: wp('0.5%'),
  },
  activeImageDot: {
    backgroundColor: COLORS.primary,
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
  },
  productInfo: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  productName: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: wp('1%'),
    lineHeight: fontSize.sm,
  },
  productPrice: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: wp('1%'),
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
    fontSize: fontSize.xs,
    color: COLORS.textSecondary,
    marginLeft: wp('1%'),
  },
  priceText: {
    fontSize: fontSize.xs,
    color: COLORS.textPrimary,
    fontWeight: '800',
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
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  categoryTabsContainer: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryScrollView: {
    flexGrow: 0,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    minWidth: '100%',
  },
  categoryButton: {
    paddingVertical: wp('1.25%'),
    paddingHorizontal: spacing.sm,
    borderRadius: wp('6.25%'),
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
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
    transform: [{scale: 1.05}],
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
