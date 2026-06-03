import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { moderateScale, normalizeFont, scale } from "../Responsive";

export default function TabLayout() {
  const API_BASE = "https://w7xqb95q-5000.inc1.devtunnels.ms";
  const [cartCount, setCartCount] = useState(0);

  const colorScheme = useColorScheme();

  /* ================= FETCH CART COUNT ================= */
  const fetchCartCount = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setCartCount(0);
        return;
      }

      const res = await fetch(`${API_BASE}/api/buyer/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        setCartCount(0);
        return;
      }

      const json = await res.json();

      const items =
        json?.data?.items || json?.data?.cartItems || json?.cartItems || [];

      setCartCount(Array.isArray(items) ? items.length : 0);
    } catch (error) {
      console.warn("fetchCartCount error:", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCartCount();
    }, []),
  );

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarItemStyle: styles.tabItem,
        tabBarButton: HapticTab,
      }}
    >
      {/* ================= HOME ================= */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <IconSymbol
                size={30}
                name="house.fill"
                color={focused ? "#fff" : "#666"}
              />
            </View>
          ),
          tabBarLabel: "Home",
        }}
      />

      {/* ================= CATEGORY ================= */}
      <Tabs.Screen
        name="category"
        options={{
          title: "Category",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <Ionicons
                name="grid"
                size={30}
                color={focused ? "#fff" : "#666"}
              />
            </View>
          ),
          tabBarLabel: "Category",
        }}
      />

      {/* ================= MAP ================= */}
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={30}
                color={focused ? "#fff" : "#666"}
              />
            </View>
          ),
          tabBarLabel: "Map",
        }}
      />

      {/* ================= MY CART ================= */}
      <Tabs.Screen
        name="myCard"
        options={{
          title: "My Cart",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <View style={styles.cartWrapper}>
                <Image
                  source={require("../../assets/via-farm-img/icons/Mycard.png")}
                  style={[
                    styles.myCardIcon,
                    { tintColor: focused ? "#fff" : "#666" },
                  ]}
                  resizeMode="contain"
                />

                {/* 🔴 CART BADGE */}
                {cartCount > 0 && (
                  <View style={styles.badgeCircle}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ),
          tabBarLabel: "My Cart",
        }}
      />
    </Tabs>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    height: scale(82),
    paddingBottom: moderateScale(12),
    paddingTop: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  tabLabel: {
    fontSize: normalizeFont(11),
    fontWeight: "600",
    marginTop: moderateScale(3),
  },

  tabItem: {
    marginTop: moderateScale(5),
  },

  iconContainer: {
    width: scale(80),
    height: scale(70),
    marginTop: moderateScale(5),
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
  },

  activeIconContainer: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  cartWrapper: {
    position: "relative",
  },

  myCardIcon: {
    width: scale(25),
    height: scale(25),
  },

  badgeCircle: {
    position: "absolute",
    top: -6,
    right: -10,
    width: scale(15),
    height: scale(15),
    borderRadius: scale(50),
    flexDirection: "row",
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: normalizeFont(10),
    fontWeight: "700",
  },
});
