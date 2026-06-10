

// app/screens/LoginScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useContext, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import {
  isIOS,
  moderateScale,
  normalizeFont,
  scale,
  verticalScale,
} from "../Responsive";
import { saveToken } from "../utility/Storage";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [mobile, setMobile] = useState("9696340330");
  const [password, setPassword] = useState("mmmmmm");
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!mobile.trim()) {
      Alert.alert("Error", "Please enter mobile number");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter password");
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert("Error", "Please enter valid 10-digit mobile number");
      return;
    }

    try {
      const response = await login(mobile, password);

      if (response.status === "success") {
        saveToken(response?.data?.token);
        const userRole = response.data?.user?.role;

        if (userRole === "Vendor") {
          navigation.reset({
            index: 0,
            routes: [{ name: "(vendors)" }],
          });
        } else if (userRole === "Buyer") {
          navigation.reset({
            index: 0,
            routes: [{ name: "(tabs)" }],
          });
        } else {
          Alert.alert("Error", "Invalid user role");
        }
      } else {
        Alert.alert("Error", response.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Something went wrong, try again later",
      );
    }
  };

  const handleOtpLogin = () => navigation.navigate("loginWithOtp");
  const ForgetPassword = () => navigation.navigate("forget-password");
  const registerNew = () => navigation.navigate("register");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={isIOS ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={isIOS ? verticalScale(10) : verticalScale(18)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Image
              style={styles.logoImage}
              source={require("../../assets/via-farm-img/icons/logo.png")}
            />

            <View style={styles.card}>
              <Text allowFontScaling={false} style={styles.heading}>
                Welcome to Viafarm!
              </Text>

              {/* Mobile Number Field */}
              <View style={styles.inputContainer}>
                <Text allowFontScaling={false} style={styles.label}>
                  Mobile Number
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={mobile}
                  onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ""))}
                  style={styles.input}
                  maxLength={10}
                  returnKeyType="next"
                  placeholder="Enter 10-digit mobile"
                  placeholderTextColor="#9e9e9e"
                  allowFontScaling={false}
                />
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <Text allowFontScaling={false} style={styles.label}>
                  Password
                </Text>
                <TextInput
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  returnKeyType="done"
                  placeholder="Your password"
                  placeholderTextColor="#9e9e9e"
                  allowFontScaling={false}
                />
              </View>

              <TouchableOpacity
                style={styles.forgotWrapper}
                onPress={ForgetPassword}
              >
                <Text allowFontScaling={false} style={styles.forgotText}>
                  Forgot password ?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="log-in-outline"
                  size={moderateScale(18)}
                  color="#fff"
                />
                <Text allowFontScaling={false} style={styles.loginText}>
                  Login
                </Text>
              </TouchableOpacity>

              {/* Login with OTP */}
              <TouchableOpacity
                style={styles.otpBtn}
                onPress={handleOtpLogin}
                activeOpacity={0.85}
              >
                {/* <Ionicons name="key-outline" size={moderateScale(16)} color="rgba(76,175,80,1)" /> */}
                <Text allowFontScaling={false} style={styles.otpText}>
                  Login with OTP
                </Text>
              </TouchableOpacity>

              {/* SignUp */}
              <View style={styles.signupWrapper}>
                <Text allowFontScaling={false} style={styles.signupText}>
                  Don't have an account?{" "}
                </Text>
                <TouchableOpacity onPress={registerNew}>
                  <Text allowFontScaling={false} style={styles.signupLink}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- responsive sizing helpers ---------- */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HORIZONTAL_MARGIN = moderateScale(18);
const MAX_CARD_WIDTH = scale(420);
const CARD_WIDTH = Math.min(
  Math.max(SCREEN_WIDTH - HORIZONTAL_MARGIN * 2, scale(320)),
  MAX_CARD_WIDTH,
);

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: isIOS ? verticalScale(36) : verticalScale(24),
    paddingBottom: moderateScale(20),
  },

  logoImage: {
    width: Math.min(scale(400), CARD_WIDTH * 0.75),
    height: Math.min(verticalScale(350), CARD_WIDTH * 0.75),
    resizeMode: "contain",
    marginBottom: verticalScale(-10),
  },
  card: {
    width: "100%",
    minHeight: verticalScale(420),
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(22),
    marginTop: verticalScale(28),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 3,
    borderColor: "rgba(255, 202, 40, 1)",
    alignItems: "stretch",
  },
  heading: {
    fontSize: normalizeFont(20),
    fontWeight: "600",
    marginBottom: moderateScale(20),
    color: "#222",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: moderateScale(12),
  },
  label: {
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(6),
    marginLeft: moderateScale(2),
  },
  input: {
    width: "100%",
    paddingVertical: moderateScale(14),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    backgroundColor: "#fafafa",
    fontSize: normalizeFont(13),
    color: "#222",
  },

  forgotWrapper: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: moderateScale(16),
    paddingLeft: moderateScale(4),
  },
  forgotText: {
    color: "#007AFF",
    fontSize: normalizeFont(13),
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "68%",
    alignSelf: "center",
    paddingVertical: moderateScale(17),
    borderRadius: moderateScale(10),
    backgroundColor: "rgba(76, 175, 80, 1)",
    marginBottom: moderateScale(14),
    paddingHorizontal: moderateScale(8),
  },
  loginText: {
    color: "#fff",
    fontSize: normalizeFont(14),
    fontWeight: "700",
    marginLeft: moderateScale(8),
  },
  otpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "68%",
    marginTop: moderateScale(6),
    alignSelf: "center",
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(10),
    borderWidth: 1.6,
    borderColor: "rgba(76, 175, 80, 1)",
    marginBottom: moderateScale(12),
    backgroundColor: "#fff",
  },
  otpText: {
    color: "rgba(76, 175, 80, 1)",
    fontSize: normalizeFont(13),
    fontWeight: "700",
    marginLeft: moderateScale(8),
  },
  signupWrapper: {
    flexDirection: "row",
    marginTop: moderateScale(6),
    justifyContent: "center",
  },
  signupText: {
    fontSize: normalizeFont(12),
    color: "#555",
  },
  signupLink: {
    fontSize: normalizeFont(12),
    color: "#007AFF",
    fontWeight: "700",
  },
});
