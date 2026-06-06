import { Redirect } from "expo-router";
import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthContext } from "./context/AuthContext";

export default function HomeScreen() {
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

  if (role === "vendor") {
    return <Redirect href="/(vendors)" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
