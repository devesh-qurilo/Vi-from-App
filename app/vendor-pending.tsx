import { Redirect } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "./context/AuthContext";
import { getAuthenticatedRoute, getVendorStatus } from "./utility/authRouting";

export default function VendorPendingScreen() {
  const auth = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, []),
  );

  if (!auth || auth.loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!auth.user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = String(auth.user?.role || "").toLowerCase();
  const vendorStatus = getVendorStatus(auth.user);

  if (role !== "vendor" || vendorStatus !== "pending") {
    return <Redirect href={getAuthenticatedRoute(auth.user) as any} />;
  }

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Approval Pending</Text>
        <Text style={styles.message}>
          Your vendor account is waiting for admin approval. Once the admin
          approves it and you get the notification, please login again.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Back To Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopWidth: 4,
    borderTopColor: "#F59E0B",
    borderRadius: 18,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
