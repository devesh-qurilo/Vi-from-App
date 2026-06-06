import { Redirect } from "expo-router";
import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "./context/AuthContext";
import { getAuthenticatedRoute, getVendorStatus } from "./utility/authRouting";

export default function VendorRejectedScreen() {
  const auth = useContext(AuthContext);

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

  if (role !== "vendor" || vendorStatus !== "rejected") {
    return <Redirect href={getAuthenticatedRoute(auth.user) as any} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Application Rejected</Text>
        <Text style={styles.message}>
          Your vendor account request was rejected by the admin. Please contact
          support or register again with the correct details.
        </Text>
        <TouchableOpacity style={styles.button} onPress={auth.logout}>
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
    borderColor: "#FECACA",
    borderTopWidth: 4,
    borderTopColor: "#DC2626",
    borderRadius: 18,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#991B1B",
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
    backgroundColor: "#DC2626",
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
