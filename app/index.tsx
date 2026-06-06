import { Redirect } from "expo-router";
import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthContext } from "./context/AuthContext";
import { getAuthenticatedRoute } from "./utility/authRouting";

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

  return <Redirect href={getAuthenticatedRoute(auth.user) as any} />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
