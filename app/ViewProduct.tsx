import SuggestionCard from "@/components/myCard/SuggestionCard";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { goBack, navigate } from "expo-router/build/global-state/routing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Responsive from "./Responsive";

const { moderateScale, scale, verticalScale, normalizeFont } = Responsive;

const API_BASE = "https://vi-farm-backend.onrender.com";
const { width: SCREEN_W } = Dimensions.get("window");

const scaleFont = (size) => {
  try {
    const n = normalizeFont(size);
    return Math.round(n * 1.08);
  } catch (e) {
    return normalizeFont(size);
  }
};

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [cardGet, setCardGet] = useState(0);
  const [recommended, setRecommended] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [inWishlist, setInWishlist] = useState(false);
  const [pincode, setPincode] = useState("110015");
  const [coupon, setCoupon] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [vendorExpanded, setVendorExpanded] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState("");

  // Cart states - FIXED: Use cartItems object like in first file
  const [cartItems, setCartItems] = useState({});
  const [cartItemId, setCartItemId] = useState(null);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [editQuantity, setEditQuantity] = useState("1");

  const [message, setMessage] = useState(null);
  const messageAnim = useRef(new Animated.Value(0)).current;
  const messageTimerRef = useRef(null);

  const showMessage = (msg) => {
    if (!msg) return;
    setMessage(String(msg));
    Animated.timing(messageAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = setTimeout(() => {
      Animated.timing(messageAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMessage(null));
      messageTimerRef.current = null;
    }, 1800);
    console.warn("UI message:", msg);
  };

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  // Check if product is in cart
  const isInCart = () => {
    if (!product) return false;
    const productId = product._id || product.id;
    return cartItems[productId]?.quantity > 0;
  };

  // Get cart quantity for this product
  const getCartQuantity = () => {
    if (!product) return 0;
    const productId = product._id || product.id;
    return cartItems[productId]?.quantity || 0;
  };

  // Format address function
  const formatAddress = (address) => {
    if (!address) return "";
    const parts = [];
    if (address.houseNumber) parts.push(address.houseNumber);
    if (address.locality || address.street)
      parts.push(address.locality || address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pinCode) parts.push(address.pinCode);
    return parts.join(", ");
  };

  const fetchAddresses = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("No token found for fetching addresses");
        return;
      }

      console.log("Fetching addresses...");
      const res = await axios.get(`${API_BASE}/api/buyer/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (res.data?.success && res.data?.addresses) {
        const formattedAddresses = res.data.addresses.map((addr) => ({
          ...addr,
          // Ensure both _id and id are available
          id: addr._id || addr.id,
          formattedAddress: formatAddress(addr),
        }));
        setAddresses(formattedAddresses);

        try {
          console.log("Fetching selected delivery address...");
          const selectedRes = await axios.get(
            `${API_BASE}/api/buyer/delivery/address`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            },
          );

          if (selectedRes.data?.success && selectedRes.data?.addressId) {
            const selectedAddr = formattedAddresses.find(
              (addr) =>
                addr._id === selectedRes.data.addressId ||
                addr.id === selectedRes.data.addressId,
            );
            if (selectedAddr) {
              setSelectedAddress(selectedAddr);
              getDeliveryCharges(selectedAddr);
              return;
            }
          }
        } catch (err) {
          console.log(
            "Error fetching selected address or no selected address found:",
            err?.response?.data ?? err.message,
          );
        }

        // Find default address
        const defaultAddress = formattedAddresses.find(
          (addr) => addr.isDefault,
        );
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
          getDeliveryCharges(defaultAddress);
        } else if (formattedAddresses.length > 0) {
          setSelectedAddress(formattedAddresses[0]);
          getDeliveryCharges(formattedAddresses[0]);
        } else {
          console.log("No addresses found");
        }
      } else {
        console.log("No addresses data in response");
      }
    } catch (err) {
      console.error(
        "fetchAddresses error:",
        err?.response?.data ?? err.message,
      );
      showMessage("Failed to load addresses");
    }
  }, []);

  // Fetch cart items like in first file
  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const items = response.data.data?.items || [];
        const cartMap = {};
        items.forEach((item) => {
          const productId = item.productId || item._id || item.id;
          cartMap[productId] = {
            quantity: item.quantity || item.qty || 1,
            cartItemId: item._id || item.id || item.cartItemId,
          };
        });
        setCartItems(cartMap);

        // Update cart count
        setCardGet(items.length);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const wishlistItems = response.data.data?.items || [];
        setWishlist(wishlistItems.length);

        // Check if current product is in wishlist
        const productId = product?._id || product?.id;
        if (productId) {
          const isFavorite = wishlistItems.some(
            (item) =>
              item.productId === productId ||
              item._id === productId ||
              item.id === productId,
          );
          setInWishlist(isFavorite);
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        showMessage("Login required");
        return false;
      }

      // Check if addressId is valid
      if (!addressId) {
        showMessage("Invalid address ID");
        return false;
      }

      const res = await axios.put(
        `${API_BASE}/api/buyer/addresses/${addressId}/default`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        },
      );

      if (res.data?.success) {
        // Update addresses state with new default
        const updatedAddresses = addresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === addressId || addr.id === addressId,
        }));

        setAddresses(updatedAddresses);

        // Find and set selected address
        const selectedAddr = updatedAddresses.find(
          (addr) => addr._id === addressId || addr.id === addressId,
        );

        if (selectedAddr) {
          setSelectedAddress(selectedAddr);
          getDeliveryCharges(selectedAddr);
        }

        showMessage("Default address updated successfully");
        return true;
      } else {
        showMessage(res.data?.message || "Failed to set default address");
        return false;
      }
    } catch (err) {
      console.error(
        "setDefaultAddress error:",
        err?.response?.data ?? err.message,
      );
      showMessage(
        err.response?.data?.message || "Failed to set default address",
      );
      return false;
    }
  };

  const getDeliveryCharges = async (address) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token || !address?.pinCode) return;

      const res = await axios.get(
        `${API_BASE}/api/buyer/cart/delivery-charge?pincode=${address.pinCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.success) {
        setDeliveryCharge(res.data.data?.deliveryCharge || "0");
      }
    } catch (error) {
      console.log("Delivery charge error:", error);
      setDeliveryCharge("0");
    }
  };

  const fetchProduct = useCallback(
    async (id) => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/buyer/products/${id}`, {
          headers,
          timeout: 10000,
        });

        if (res.data?.success && res.data?.data?.product) {
          const p = res.data.data.product;
          setProduct(p);
          setVendor(res.data.data.vendor ?? p.vendor ?? null);
          setRecommended(res.data.data.recommendedProducts ?? []);
          setReviews(res.data.data.reviews?.list ?? []);

          if (token) {
            await fetchAddresses();
            await fetchCart();
            await fetchWishlist();
          }

          // Set shipping address if available from product response
          if (res.data.data.buyer?.address) {
            const buyerAddress = res.data.data.buyer.address;
            const formattedAddr = formatAddress(buyerAddress);

            setSelectedAddress({
              _id: "current_buyer_address",
              formattedAddress: formattedAddr,
              pinCode: buyerAddress.pinCode,
              ...buyerAddress,
            });
            setPincode(buyerAddress.pinCode ?? pincode);
          }
        } else {
          showMessage("Product not found");
          navigation.back?.();
        }
      } catch (err) {
        console.error(
          "fetchProduct error:",
          err?.response?.data ?? err.message,
        );
        showMessage("Failed to load product");
        navigation.back?.();
      } finally {
        setLoading(false);
      }
    },
    [navigation, pincode, fetchAddresses],
  );

  useEffect(() => {
    if (!productId) {
      showMessage("Product id missing");
      return;
    }
    fetchProduct(productId);
  }, [productId, fetchProduct]);

  // Add to cart handler (like in first file)
  const handleAddToCart = async (delta = 1) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Login Required", "Please login to add items to cart");
        return;
      }

      const productId = product._id || product.id;
      const currentQuantity = cartItems[productId]?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity + delta);

      // Update local state immediately
      setCartItems((prev) => {
        const next = { ...prev };
        if (newQuantity > 0) {
          next[productId] = {
            quantity: newQuantity,
            cartItemId: prev[productId]?.cartItemId || productId,
          };
        } else {
          delete next[productId];
        }
        return next;
      });

      const payload = {
        productId,
        name: product.name,
        image: (product.images && product.images[0]) || product.image || "",
        price: product.price,
        quantity: delta,
        category: product.category || "",
        variety: product.variety || "",
        unit: product.unit || "",
        vendorId: vendor?._id || product.vendor?._id || product.vendor,
      };

      const res = await axios.post(`${API_BASE}/api/buyer/cart/add`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const serverId = res.data.data?._id || productId;
        setCartItems((prev) => ({
          ...prev,
          [productId]: {
            quantity: newQuantity,
            cartItemId: serverId,
          },
        }));
        showMessage("Cart updated successfully");
        await fetchCart(); // Refresh cart count
      } else {
        // Revert on error
        setCartItems((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        showMessage("Failed to update cart");
      }
    } catch (err) {
      console.error("Error updating cart:", err);
      // Revert on error
      const productId = product._id || product.id;
      setCartItems((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      if (err.response?.status === 400) {
        await fetchCart();
      }
      showMessage("Failed to update cart");
    }
  };

  // Update quantity handler (like in first file)
  const handleUpdateQuantity = async (delta) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        showMessage("Login Required");
        return;
      }

      const productId = product._id || product.id;
      const currentItem = cartItems[productId] || {
        quantity: 0,
        cartItemId: productId,
      };
      const newQuantity = (currentItem.quantity || 0) + delta;

      if (newQuantity < 1) {
        // Remove from cart
        setCartItems((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });

        const res = await axios.delete(
          `${API_BASE}/api/buyer/cart/${currentItem.cartItemId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.data?.success) {
          await fetchCart();
        } else {
          showMessage("Removed from cart");
          await fetchCart(); // Refresh cart count
        }
      } else {
        // Update quantity
        setCartItems((prev) => ({
          ...prev,
          [productId]: { ...currentItem, quantity: newQuantity },
        }));

        const res = await axios.put(
          `${API_BASE}/api/buyer/cart/${currentItem.cartItemId}/quantity`,
          { quantity: newQuantity },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.data?.success) {
          await fetchCart();
        } else {
          showMessage("Quantity updated");
        }
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      await fetchCart();
      showMessage("Failed to update quantity");
    }
  };

  // Toggle wishlist handler (like in first file)
  const handleToggleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        showMessage("Login Required");
        return;
      }

      const productId = product._id || product.id;

      if (inWishlist) {
        // Remove from wishlist
        setInWishlist(false);
        await axios.delete(`${API_BASE}/api/buyer/wishlist/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showMessage("Removed from wishlist");
        await fetchWishlist();
      } else {
        // Add to wishlist
        setInWishlist(true);
        const payload = {
          productId,
          name: product.name,
          image: (product.images && product.images[0]) || product.image || "",
          price: product.price,
          category: product.category || "",
          variety: product.variety || "",
          unit: product.unit || "",
          weight: product.weightPerPiece,
        };
        await axios.post(`${API_BASE}/api/buyer/wishlist/add`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showMessage("Added to wishlist");
        await fetchWishlist();
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
      setInWishlist(!inWishlist); // Revert on error
      showMessage("Failed to update wishlist");
    }
  };

  // Quantity modal handlers (like in first file)
  const openQtyModal = () => {
    setEditQuantity(String(getCartQuantity() || 1));
    setQtyModalVisible(true);
  };

  const closeQtyModal = () => {
    setQtyModalVisible(false);
  };

  const applyQuantityChange = () => {
    const parsed = parseFloat(String(editQuantity).replace(/[^0-9.]/g, ""));

    const newQty = Number.isNaN(parsed)
      ? 0
      : Math.max(0, Math.round(parsed * 10) / 10);

    const currentQty = getCartQuantity();
    const delta = Math.round((newQty - currentQty) * 10) / 10;

    if (delta === 0) {
      closeQtyModal();
      return;
    }

    try {
      handleUpdateQuantity(delta);
    } catch (err) {
      console.error("applyQuantityChange error:", err);
    } finally {
      closeQtyModal();
    }
  };

  const incrementEdit = () => {
    const v = Number(editQuantity);
    const safe = isNaN(v) ? 0 : v;
    const newVal = Math.round((safe + 1) * 10) / 10;
    setEditQuantity(String(newVal));
  };

  const decrementEdit = () => {
    const v = Number(editQuantity);
    const safe = isNaN(v) ? 0 : v;
    const newVal = Math.max(0, Math.round((safe - 1) * 10) / 10);
    setEditQuantity(String(newVal));
  };

  const openVendorMap = () => {
    navigation.navigate("map");
  };

  const openRecommended = (id) => {
    if (!id) return;
    navigation.push?.({
      pathname: "/ViewOrderProduct",
      params: { productId: id },
    }) || navigation.navigate?.("ViewOrderProduct", { productId: id });
  };

  const openVendorDetails = () => {
    const vid =
      vendor?.id ?? vendor?._id ?? product.vendor?._id ?? product.vendor;
    if (!vid) {
      showMessage("Vendor not available");
      return;
    }
    navigation.navigate?.("VendorsDetails", { vendorId: vid });
  };

  // Address modal functions
  const openAddressModal = () => {
    setAddressModalVisible(true);
  };

  const closeAddressModal = () => {
    setAddressModalVisible(false);
  };

  const selectAddress = async (address) => {
    console.log("Selecting address:", address);
    const oldAddress = selectedAddress;

    // Set the selected address immediately for better UX
    setSelectedAddress(address);

    // Get the address ID (support both _id and id)
    const addressId = address._id || address.id;

    if (!addressId) {
      showMessage("Address ID not found");
      setSelectedAddress(oldAddress);
      return;
    }

    // Try to set as default address
    const success = await setDefaultAddress(addressId);

    if (!success) {
      // Revert if failed
      setSelectedAddress(oldAddress);
    }

    closeAddressModal();
  };

  const map = () => {
    router.push("/map");
  };

  const headerWishlistPress = () => {
    navigation.navigate("wishlist");
  };

  const headerCartPress = () => {
    navigation.navigate("OnlyRoutingCart");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.center}>
        <Text allowFontScaling={false}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const vendorAddr = vendor?.address ?? product.vendor?.address ?? {};
  const pickupAddress = formatAddress(vendorAddr);
  const vendorDistance = vendor?.distance || "Distance not available";
  const currentQuantity = getCartQuantity();

  return (
    <SafeAreaView style={styles.page}>
      {/* non-blocking message banner */}
      {message ? (
        <Animated.View
          style={[
            toastStyles.container,
            {
              opacity: messageAnim,
              transform: [
                {
                  translateY: messageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={2}
            style={toastStyles.text}
          >
            {message}
          </Text>
        </Animated.View>
      ) : null}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>

        <Text
          allowFontScaling={false}
          style={styles.headerTitle}
          numberOfLines={1}
        >
          {product.name}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={headerWishlistPress}
            style={{ marginRight: moderateScale(12) }}
          >
            <Ionicons name="heart-outline" size={scale(27)} color="#000" />
            <View style={styles.countWishlistA}>
              <Text allowFontScaling={false} style={styles.countA}>
                {wishlist || "0"}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={headerCartPress}
            style={{ marginRight: moderateScale(12) }}
          >
            <Ionicons name="cart-outline" size={scale(27)} color="#000" />
            <View style={styles.countWishlistA}>
              <Text allowFontScaling={false} style={styles.countA}>
                {cardGet || "0"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: product.images?.[0] }}
          style={styles.heroImage}
          resizeMode="stretch"
        />

        <TouchableOpacity
          style={styles.favButton}
          onPress={handleToggleFavorite}
        >
          {inWishlist ? (
            <Ionicons name="heart" size={24} color="red" />
          ) : (
            <Image
              source={require("../assets/via-farm-img/icons/mainHeartIcon.png")}
              style={{ width: scale(22), height: scale(25) }}
            />
          )}
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: moderateScale(8) }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text allowFontScaling={false} style={styles.title}>
                  {product.name}
                </Text>
                <View style={styles.ratingPill}>
                  <Image
                    source={require("../assets/via-farm-img/icons/satar.png")}
                  />
                  <Text
                    allowFontScaling={false}
                    style={{ fontWeight: "700", fontSize: scaleFont(12) }}
                  >
                    {Number(product.rating || 0).toFixed(1)}
                  </Text>
                </View>
              </View>

              <Text allowFontScaling={false} style={styles.mrp}>
                MRP{" "}
                <Text
                  style={{
                    fontWeight: 700,
                    color: "#000",
                    fontSize: scaleFont(13),
                  }}
                >
                  ₹{product.price}/{product.unit ?? "pc"}
                </Text>
              </Text>
            </View>
          </View>

          <Text
            allowFontScaling={false}
            style={[styles.sectionTitle, { marginTop: moderateScale(12) }]}
          >
            About the product
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: scaleFont(11),
              marginVertical: moderateScale(5),
            }}
          >
            Category: {product.category}
          </Text>
          <Text allowFontScaling={false} style={{ fontSize: scaleFont(11) }}>
            Variety: {product.variety}
          </Text>

          <Text
            allowFontScaling={false}
            style={[styles.description, { fontSize: scaleFont(12) }]}
          >
            Description: {product.description}
          </Text>

          <TouchableOpacity
            style={styles.vendorHeader}
            onPress={() => setVendorExpanded((v) => !v)}
          >
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              About the vendor
            </Text>
            <Ionicons
              name={vendorExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          {vendorExpanded && (
            <TouchableOpacity
              onPress={openVendorDetails}
              activeOpacity={0.8}
              style={styles.vendorExpanded}
            >
              <Image
                source={{
                  uri: vendor?.profilePicture ?? product.vendor?.profilePicture,
                }}
                style={styles.vendorImage}
              />
              <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
                <Text
                  allowFontScaling={false}
                  style={{ fontWeight: "600", fontSize: scaleFont(11) }}
                >
                  {vendor?.name ?? product.vendor?.name}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    color: "#666",
                    marginTop: moderateScale(6),
                    fontSize: scaleFont(11),
                  }}
                >
                  {pickupAddress}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Pickup Location Section */}
          <View style={styles.pickupLocationContainer}>
            <Text
              allowFontScaling={false}
              style={{
                marginVertical: moderateScale(16),
                fontSize: scaleFont(10),
              }}
            >
              Pickup Location
            </Text>
            <View style={styles.pickupLocationCard}>
              <View style={styles.locationIconContainer}>
                <Image
                  style={styles.locationIcon}
                  source={require("../assets/via-farm-img/icons/mainLocationIcon.png")}
                />
              </View>
              <View style={styles.pickupLocationDetails}>
                <Text allowFontScaling={false} style={styles.pickupAddressText}>
                  {pickupAddress || "Address not available"}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={styles.pickupDistanceText}
                >
                  ( {vendorDistance} )
                </Text>
              </View>
              <TouchableOpacity onPress={map}>
                <Image
                  source={require("../assets/via-farm-img/icons/directionLocation.png")}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text
            allowFontScaling={false}
            style={{ marginTop: moderateScale(16), fontSize: scaleFont(10) }}
          >
            Delivery to:
          </Text>

          {/* Delivery Address Selection Section */}
          <View style={styles.pickupRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Image
                style={{
                  width: moderateScale(20),
                  height: moderateScale(28),
                  resizeMode: "stretch",
                }}
                source={require("../assets/via-farm-img/icons/mainLocationIcon.png")}
              />
              <View style={{ marginLeft: moderateScale(10), flex: 1 }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    color: "#666",
                    fontSize: scaleFont(11),
                    maxWidth: SCREEN_W - scale(120),
                  }}
                  numberOfLines={2}
                >
                  {selectedAddress?.formattedAddress ||
                    "Select delivery address"}
                </Text>
              </View>
            </View>
            {/* Change Button */}
            <TouchableOpacity
              onPress={openAddressModal}
              style={styles.changeBtn}
            >
              <Text allowFontScaling={false} style={styles.changeBtnText}>
                Change
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            allowFontScaling={false}
            style={{
              marginTop: moderateScale(10),
              fontSize: scaleFont(10),
              marginBottom: moderateScale(15),
            }}
          >
            Delivery By {vendor?.estimatedDeliveryDate || "Sep 20"},
            <Text
              allowFontScaling={false}
              style={{
                paddingHorizontal: moderateScale(8),
                paddingVertical: moderateScale(2),
                color: "#000",
                borderRadius: moderateScale(10),
                marginLeft: moderateScale(5),
              }}
            >
              ₹{deliveryCharge || "0"}
            </Text>
          </Text>

          <View style={{ marginTop: moderateScale(6) }}>
            <View style={styles.reviewHeaderRow}>
              <Text
                allowFontScaling={false}
                style={styles.reviewTitle}
                numberOfLines={1}
              >
                Ratings & Reviews
              </Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate?.("SeeAllReview", { vendor, reviews })
                }
                style={styles.seeAllBtn}
                activeOpacity={0.7}
              >
                <Text
                  allowFontScaling={false}
                  style={styles.seeAllText}
                  numberOfLines={1}
                >
                  See All
                </Text>
                <Image
                  source={require("../assets/via-farm-img/icons/see.png")}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={reviews.filter((r) => r.images && r.images.length > 0)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(it, idx) => String(it.id ?? idx)}
              contentContainerStyle={{
                paddingVertical: moderateScale(10),
                paddingHorizontal: moderateScale(12),
              }}
              renderItem={({ item }) => (
                <View style={{ marginRight: moderateScale(10) }}>
                  {item.images.map((img, i) => (
                    <Image
                      key={i}
                      source={{ uri: img }}
                      style={{
                        width: scale(120),
                        height: scale(120),
                        borderRadius: moderateScale(8),
                        marginBottom: moderateScale(6),
                      }}
                    />
                  ))}
                </View>
              )}
            />
          </View>

          <FlatList
            data={reviews.filter(
              (r) => r.comment && r.comment.trim().length > 0,
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(it, idx) => String(it.id ?? idx)}
            contentContainerStyle={{
              paddingHorizontal: moderateScale(12),
              paddingBottom: moderateScale(18),
            }}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: moderateScale(8),
                  }}
                >
                  <Image
                    source={{
                      uri:
                        item.user?.profilePicture ??
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    }}
                    style={{
                      width: scale(40),
                      height: scale(40),
                      borderRadius: moderateScale(20),
                      marginRight: moderateScale(10),
                    }}
                  />
                  <View>
                    <Text
                      allowFontScaling={false}
                      style={{ fontWeight: "700", fontSize: scaleFont(12) }}
                    >
                      {item.user?.name ?? "Anonymous"}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{ color: "#777", fontSize: scaleFont(11) }}
                    >
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: moderateScale(8),
                  }}
                >
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text
                    allowFontScaling={false}
                    style={{ marginLeft: 6, fontSize: scaleFont(11) }}
                  >
                    {item.rating}/5
                  </Text>
                </View>
                {item.comment ? (
                  <Text style={{ color: "#444", fontSize: scaleFont(12) }}>
                    {item.comment}
                  </Text>
                ) : null}
              </View>
            )}
            ListEmptyComponent={() => (
              <View>
                <Text
                  allowFontScaling={false}
                  style={{ color: "#777", fontSize: scaleFont(11) }}
                >
                  No reviews yet
                </Text>
              </View>
            )}
          />

          <View>
            <SuggestionCard />
          </View>
        </View>
      </ScrollView>

      {/* Address Selection Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAddressModal}
      >
        <View style={addressModalStyles.modalContainer}>
          <View style={addressModalStyles.modalContent}>
            {/* Modal Header */}
            <View style={addressModalStyles.modalHeader}>
              <Text
                allowFontScaling={false}
                style={addressModalStyles.modalTitle}
              >
                Select Delivery Address
              </Text>
              <TouchableOpacity
                onPress={closeAddressModal}
                style={addressModalStyles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Address List */}
            <FlatList
              data={addresses}
              keyExtractor={(item) =>
                item._id || item.id || Math.random().toString()
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={addressModalStyles.addressList}
              renderItem={({ item }) => {
                const itemId = item._id || item.id;
                const isSelected =
                  selectedAddress &&
                  (selectedAddress._id === itemId ||
                    selectedAddress.id === itemId);

                return (
                  <TouchableOpacity
                    style={[
                      addressModalStyles.addressItem,
                      isSelected && addressModalStyles.selectedAddressItem,
                    ]}
                    onPress={() => selectAddress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={addressModalStyles.addressRadio}>
                      {isSelected ? (
                        <Ionicons
                          name="radio-button-on"
                          size={20}
                          color="#22c55e"
                        />
                      ) : (
                        <Ionicons
                          name="radio-button-off"
                          size={20}
                          color="#ccc"
                        />
                      )}
                    </View>
                    <View style={addressModalStyles.addressDetails}>
                      <Text
                        allowFontScaling={false}
                        style={addressModalStyles.addressText}
                      >
                        {item.formattedAddress || formatAddress(item)}
                      </Text>
                      {item.pinCode && (
                        <Text
                          allowFontScaling={false}
                          style={addressModalStyles.pincodeText}
                        >
                          Pincode: {item.pinCode}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <View style={addressModalStyles.emptyContainer}>
                  <Ionicons name="location-outline" size={50} color="#ccc" />
                  <Text
                    allowFontScaling={false}
                    style={addressModalStyles.emptyText}
                  >
                    No addresses found
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={addressModalStyles.emptySubText}
                  >
                    Add a new address to continue
                  </Text>
                </View>
              )}
            />

            {/* Add New Address Button */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                marginBottom: moderateScale(10),
              }}
            >
              <TouchableOpacity
                style={addressModalStyles.addButton}
                onPress={() => {
                  closeAddressModal();
                  navigate("/AddNewAddress");
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text
                  allowFontScaling={false}
                  style={addressModalStyles.addButtonText}
                >
                  Add New Address
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quantity Edit Modal (opens when clicking qty display) */}
      <Modal
        visible={qtyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeQtyModal}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={closeQtyModal}
        >
          <View
            style={[
              modalStyles.modalWrap,
              {
                maxWidth: Math.min(
                  420,
                  Dimensions.get("window").width - moderateScale(40),
                ),
              },
            ]}
          >
            <Text allowFontScaling={false} style={modalStyles.modalTitle}>
              Add
            </Text>

            <View style={modalStyles.editRow}>
              <TouchableOpacity
                style={modalStyles.pickerBtn}
                onPress={decrementEdit}
              >
                <Ionicons name="remove" size={moderateScale(18)} color="#111" />
              </TouchableOpacity>

              <TextInput
                style={modalStyles.qtyInput}
                keyboardType="decimal-pad"
                value={String(editQuantity)}
                onChangeText={(t) => {
                  let cleaned = t.replace(/[^0-9.]/g, "");
                  const parts = cleaned.split(".");
                  if (parts.length > 2) {
                    cleaned = parts[0] + "." + parts[1];
                  }
                  if (parts[1]?.length > 1) {
                    cleaned = parts[0] + "." + parts[1].slice(0, 1);
                  }

                  setEditQuantity(cleaned);
                }}
                maxLength={5}
                placeholder="0.0"
                placeholderTextColor="#999"
                allowFontScaling={false}
              />

              <TouchableOpacity
                style={modalStyles.pickerBtn}
                onPress={incrementEdit}
              >
                <Ionicons name="add" size={moderateScale(18)} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.modalActions}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={closeQtyModal}
              >
                <Text allowFontScaling={false} style={modalStyles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.okBtn}
                onPress={applyQuantityChange}
              >
                <Text allowFontScaling={false} style={modalStyles.okText}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text
            allowFontScaling={false}
            style={{ color: "#666", fontSize: scaleFont(12) }}
          >
            Price
          </Text>
          <Text
            allowFontScaling={false}
            style={{ fontWeight: "600", fontSize: scaleFont(16) }}
          >
            ₹{product.price}
          </Text>
        </View>

        {currentQuantity > 0 ? (
          <View style={styles.quantityControlContainer}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => handleUpdateQuantity(-1)}
            >
              <Text allowFontScaling={false} style={styles.qtyBtnText}>
                −
              </Text>
            </TouchableOpacity>

            {/* Make qty display pressable to open modal */}
            <TouchableOpacity style={styles.qtyDisplay} onPress={openQtyModal}>
              <Text allowFontScaling={false} style={styles.qtyText}>
                {String(currentQuantity).padStart(2, "0")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => handleUpdateQuantity(1)}
            >
              <Text allowFontScaling={false} style={styles.qtyBtnText}>
                +
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => handleAddToCart(1)}
          >
            <Ionicons name="cart" size={18} color="#fff" />
            <Text allowFontScaling={false} style={styles.cartBtnText}>
              Add to Cart
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: moderateScale(8),
    left: moderateScale(12),
    right: moderateScale(12),
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    zIndex: 9999,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    textAlign: "center",
    fontSize: normalizeFont(12),
  },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 0.4,
    borderBottomColor: "#eee",
  },
  iconBtn: { padding: moderateScale(6) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: scaleFont(15),
    fontWeight: "600",
  },
  headerRight: { flexDirection: "row", alignItems: "center" },

  countWishlistA: {
    position: "absolute",
    top: moderateScale(-6),
    right: moderateScale(-6),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    paddingHorizontal: moderateScale(4),
    borderRadius: moderateScale(11),
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    shadowColor: "grey",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 99,
  },
  countA: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFont(10),
    lineHeight: normalizeFont(12),
    textAlign: "center",
    includeFontPadding: false,
  },

  container: { flex: 1 },

  heroImage: {
    width: SCREEN_W,
    height: SCREEN_W * 0.7,
    backgroundColor: "#f3f3f3",
  },
  favButton: {
    position: "absolute",
    right: moderateScale(18),
    top: 6,
    backgroundColor: "transparent",
  },

  infoCard: {
    backgroundColor: "#fff",
    marginTop: -14,
    padding: moderateScale(14),
    minHeight: scale(220),
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: scaleFont(16), fontWeight: "700" },
  smallText: { color: "#666", fontSize: scaleFont(12) },
  mrp: { fontSize: scaleFont(12), marginTop: moderateScale(5) },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(1),
    borderRadius: 5,
    marginTop: moderateScale(8),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.4)",
  },

  sectionTitle: { fontSize: scaleFont(13), fontWeight: "600" },
  description: { color: "#444", marginTop: moderateScale(6) },

  // Pickup Location Styles
  pickupLocationContainer: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  pickupTitle: {
    fontSize: scaleFont(10),
    fontWeight: "500",
    marginBottom: moderateScale(8),
  },
  pickupLocationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9f9f9",
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: "#eee",
  },
  locationIconContainer: {
    marginRight: moderateScale(12),
    marginTop: moderateScale(2),
  },
  locationIcon: {
    width: moderateScale(20),
    height: moderateScale(28),
    resizeMode: "stretch",
  },
  pickupLocationDetails: {
    flex: 1,
  },
  pickupAddressText: {
    fontSize: scaleFont(11),
    color: "#333",
    marginBottom: moderateScale(4),
    lineHeight: moderateScale(16),
  },
  pickupDistanceText: {
    fontSize: scaleFont(10),
    color: "#666",
    textAlign: "center",
  },

  vendorHeader: {
    marginTop: moderateScale(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vendorExpanded: { flexDirection: "row", marginTop: moderateScale(10) },
  vendorImage: {
    width: scale(70),
    height: scale(70),
    borderRadius: moderateScale(10),
    backgroundColor: "#f3f3f3",
  },

  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(10),
    padding: moderateScale(12),
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },

  changeBtn: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    marginLeft: moderateScale(15),
  },

  changeBtnText: {
    color: "#0197DA",
    fontSize: scaleFont(12),
    fontWeight: "500",
  },

  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(6),
  },

  reviewTitle: {
    flex: 1,
    fontWeight: "500",
    fontSize: scaleFont(12),
    marginRight: moderateScale(8),
  },

  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    maxWidth: scale(90),
  },

  seeAllText: {
    color: "#3b82f6",
    fontSize: scaleFont(11),
    marginRight: moderateScale(4),
    flexShrink: 0,
  },

  seeAllIcon: {
    width: scale(14),
    height: scale(14),
    resizeMode: "contain",
  },

  reviewCard: {
    width: scale(300),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginRight: moderateScale(12),
    elevation: 2,
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(12),
    borderTopWidth: 0.6,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
  },
  cartBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: moderateScale(8),
    fontSize: scaleFont(14),
  },

  quantityControlContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#22c55e",
    borderRadius: moderateScale(10),
    overflow: "hidden",
  },
  qtyBtn: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    minWidth: moderateScale(36),
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 0,
  },
  qtyBtnText: {
    fontSize: scaleFont(16),
    fontWeight: "700",
    color: "#22c55e",
  },
  qtyDisplay: {
    minWidth: scale(42),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(10),
    backgroundColor: "#fff",
  },
  qtyText: {
    fontWeight: "700",
    fontSize: scaleFont(13),
    color: "#22c55e",
  },
});

/* Address Modal Styles */
const addressModalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: "80%",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#FFCA28",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: scaleFont(16),
    fontWeight: "700",
    color: "#333",
  },
  closeBtn: {
    padding: moderateScale(4),
  },
  addressList: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: moderateScale(14),
    marginBottom: moderateScale(12),
    backgroundColor: "#f9f9f9",
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedAddressItem: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
  },
  addressRadio: {
    marginRight: moderateScale(12),
    marginTop: moderateScale(2),
  },
  addressDetails: {
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(4),
    alignSelf: "flex-start",
    marginBottom: moderateScale(6),
  },
  defaultText: {
    color: "#fff",
    fontSize: scaleFont(10),
    fontWeight: "600",
  },
  addressText: {
    fontSize: scaleFont(13),
    color: "#333",
    marginBottom: moderateScale(4),
    lineHeight: moderateScale(18),
  },
  pincodeText: {
    fontSize: scaleFont(11),
    color: "#666",
    marginTop: moderateScale(4),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(40),
  },
  emptyText: {
    fontSize: scaleFont(16),
    color: "#666",
    marginTop: moderateScale(12),
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: scaleFont(12),
    color: "#999",
    marginTop: moderateScale(4),
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: moderateScale(14),
    backgroundColor: "#4CAF50",
    borderRadius: moderateScale(10),
    width: "80%",
  },
  addButtonText: {
    fontSize: scaleFont(14),
    color: "#fff",
    fontWeight: "700",
    marginLeft: moderateScale(8),
  },
});

/* Modal styles (local for qty modal) */
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },
  modalWrap: {
    width: "100%",
    maxWidth: moderateScale(360),
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    padding: moderateScale(16),
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: moderateScale(4) },
  },
  modalTitle: {
    fontSize: normalizeFont(14),
    fontWeight: "700",
    color: "#222",
    marginBottom: moderateScale(12),
    textAlign: "center",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(12),
    marginBottom: moderateScale(14),
  },
  pickerBtn: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  qtyInput: {
    flex: 1,
    minHeight: moderateScale(44),
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: moderateScale(8),
    textAlign: "center",
    fontSize: normalizeFont(16),
    paddingVertical: moderateScale(8),
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },
  cancelBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
    width: "40%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: moderateScale(1),
    borderColor: "rgba(76, 175, 80, 1)",
  },
  cancelText: {
    color: "#666",
    fontSize: normalizeFont(13),
  },
  okBtn: {
    backgroundColor: "rgba(76, 175, 80, 1)",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
    width: "40%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  okText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFont(13),
  },
});
