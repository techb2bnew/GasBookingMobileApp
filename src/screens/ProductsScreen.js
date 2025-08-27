import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, STRINGS } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { addToCart } from '../redux/slices/cartSlice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ProductsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, categories } = useSelector(state => state.products);
  const { totalItems } = useSelector(state => state.cart);
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const renderCategoryTabs = () => (
    <View style={styles.categoryTabs}>
      {categories.map(cat => (
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
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>

        {item.weight && (
          <Text style={styles.productDetail}>Weight: {item.weight}</Text>
        )}

        {item.length && (
          <Text style={styles.productDetail}>Length: {item.length}</Text>
        )}

        {item.features && (
          <View style={styles.featuresContainer}>
            {item.features.map((feature, index) => (
              <Text key={index} style={styles.featureText}>• {feature}</Text>
            ))}
          </View>
        )}

        <View style={[styles.productFooter,
        {
          flexDirection: item.category === 'Accessories' ? "row" : "column",
          justifyContent: item.category !== 'Accessories' ? "center" : "space-between"
        }]}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                !item.inStock && styles.actionButtonDisabled,
              ]}
              onPress={() => handleAddToCart(item)}
              disabled={!item.inStock}>
              <Text style={styles.actionButtonText}>
                {item.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
            {item.category !== 'Accessories' && (<TouchableOpacity
              style={[
                styles.actionButton,
                !item.inStock && styles.actionButtonDisabled,
              ]}
              onPress={() => handleRefillCylinder(item)}
              disabled={!item.inStock}>
              <Text style={styles.actionButtonText}>
                {item.inStock ? 'Refill' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
            )}

            {item.category !== 'Accessories' && (<TouchableOpacity
              style={[
                styles.actionButton,
                !item.inStock && styles.actionButtonDisabled,
              ]}
              onPress={() => handleNewConnection(item)}
              disabled={!item.inStock}>
              <Text style={styles.actionButtonText}>
                {item.inStock ? 'New Connection' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>)}
            {item.category !== 'Accessories' && (<TouchableOpacity
              style={[
                styles.actionButton,
                !item.inStock && styles.actionButtonDisabled,
              ]}
              onPress={() => handleSpareCylinder(item)}
              disabled={!item.inStock}>
              <Text style={styles.actionButtonText}>
                {item.inStock ? 'Spare Cylinder' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>)}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* <MaterialCommunityIcons name="gas-cylinder" size={28} color={"red"} style={{ marginRight: 8 }} /> */}
          <Text style={styles.title}>{STRINGS.gasBooking}</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addressButton}
            onPress={() => navigation.navigate('AddAddress')}>
            {/* <Text style={styles.addressButtonText}>Add Address</Text> */}
            <Icon name="location-on" size={24} color="#fff" />

          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}>
            {/* <Text style={styles.cartButtonText}>{STRINGS.cart}</Text> */}
            <Icon name="shopping-cart" size={24} color="#fff" />

            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* {renderCategoryTabs()} */}

      {/* Products */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsContent}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressButton: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    // paddingVertical: 10,
    borderRadius: 25,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addressButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
  title: {
    fontSize: 23,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 10,
    // paddingVertical: 10,
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

  productsContent: {
    padding: 20,
  },
  productCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.lightGray,
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  productDetail: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
    fontWeight: '500',
  },
  featuresContainer: {
    marginVertical: 8,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  productFooter: {
    flexDirection: 'column',
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
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
    paddingHorizontal: 10,
    backgroundColor: COLORS.primary,
    // justifyContent: 'center',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.error,
  },
  categoryText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  categoryTextActive: { color: COLORS.white },
});

export default ProductsScreen;

