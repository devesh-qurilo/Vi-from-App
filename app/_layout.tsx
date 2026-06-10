
import { Stack } from "expo-router";
import AuthProvider from "./context/AuthContext"; // note: ./context

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(vendors)" options={{ headerShown: false }} />
        <Stack.Screen
          name="vendor-pending"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="vendor-rejected"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
    </AuthProvider>
  );
}
