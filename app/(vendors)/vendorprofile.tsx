// VendorProfile.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "../Responsive";
import {
  createLocationPayload,
  normalizeApiLocation,
  normalizeReverseGeocodeAddress,
} from "../utils/locationAddress";

const { height } = Dimensions.get("window");
const API_BASE = "https://vi-farm-backend.onrender.com";
const ExpoFileSystem = FileSystem as Record<string, any>;
const ExpoImagePicker = ImagePicker as Record<string, any>;

// ---------------- EditProfileModal ----------------

const EditProfileModal = ({ visible, onClose, initialData = {}, onUpdate }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [mobileNumber, setMobileNumber] = useState(
    initialData?.phone || initialData?.mobileNumber || "",
  );
  const [upiId, setUpiId] = useState(initialData?.upiId || "");
  const [status, SetStatus] = useState(initialData?.status || "Active");
  const [about, SetAbout] = useState(initialData?.about || "");
  const [profileImageUri, setProfileImageUri] = useState(
    initialData?.profilePicture || initialData?.image || null,
  );

  const [farmImages, SetFarmImages] = useState(() => {
    const fromInitial = initialData?.farmImages || initialData?.images || [];
    if (!fromInitial) return [];
    if (Array.isArray(fromInitial))
      return fromInitial.map((u) => (typeof u === "string" ? { uri: u } : u));
    if (typeof fromInitial === "string") return [{ uri: fromInitial }];
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useEffect(() => {
    setName(initialData?.name || "");
    setMobileNumber(initialData?.phone || initialData?.mobileNumber || "");
    setUpiId(initialData?.upiId || "");
    SetStatus(initialData?.status || "Active");
    SetAbout(initialData?.about || "");
    setProfileImageUri(
      initialData?.profilePicture || initialData?.image || null,
    );

    const fromInitial = initialData?.farmImages || initialData?.images || [];
    if (!fromInitial) SetFarmImages([]);
    else if (Array.isArray(fromInitial))
      SetFarmImages(
        fromInitial.map((u) => (typeof u === "string" ? { uri: u } : u)),
      );
    else if (typeof fromInitial === "string")
      SetFarmImages([{ uri: fromInitial }]);
  }, [initialData]);

  const getMediaTypesOption = () => {
    return (
      ExpoImagePicker.MediaType?.Image ||
      ExpoImagePicker.MediaTypeOptions?.Images ||
      undefined
    );
  };
  const compressImage = async (uri, isFarmImage = false) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSizeInMB = fileInfo.size / (1024 * 1024);
      if (fileSizeInMB < 0.3) return uri;
      return uri;
    } catch (err) {
      console.log("Compression error:", err);
      return uri;
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "Permission to access gallery is required!",
        );
        return;
      }

      const mediaTypesOption = getMediaTypesOption();
      const options = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      };
      if (mediaTypesOption) options.mediaTypes = mediaTypesOption;

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (
        !result.canceled &&
        Array.isArray(result.assets) &&
        result.assets[0]
      ) {
        const compressedUri = await compressImage(result.assets[0].uri, false);
        setProfileImageUri(compressedUri);
      }
    } catch (err) {
      console.log("pickImage error", err);
      Alert.alert("Error", "Could not pick image. Try again.");
    }
  };

  const ImageFarm = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "Permission to access gallery is required!",
        );
        return;
      }

      const mediaTypesOption = getMediaTypesOption();
      const pickerOptions = {
        allowsMultipleSelection: true,
        quality: 0.5,
      };
      if (mediaTypesOption) pickerOptions.mediaTypes = mediaTypesOption;

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && Array.isArray(result.assets)) {
        const picked = result.assets.map((a) => ({ uri: a.uri }));
        SetFarmImages((prev) => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const combined = [...prevArr, ...picked];
          const unique = Array.from(
            new Map(combined.map((item) => [item.uri, item])).values(),
          );
          return unique.slice(0, 5);
        });
      }
    } catch (err) {
      console.log("ImageFarm error", err);
      Alert.alert("Error", "Could not pick images. Try again.");
    }
  };

  const removeImage = (index) => {
    SetFarmImages((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      arr.splice(index, 1);
      return arr;
    });
  };

  const prepareUriForUpload = async (uri) => {
    try {
      if (!uri) return null;
      if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;

      if (Platform.OS === "android") {
        if (uri.startsWith("content://")) {
          const filename = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
          const dest = `${ExpoFileSystem.cacheDirectory}${filename}`;
          try {
            await FileSystem.copyAsync({ from: uri, to: dest });
            return dest;
          } catch {
            try {
              await FileSystem.downloadAsync(uri, dest);
              return dest;
            } catch {
              return uri;
            }
          }
        }
        return uri;
      }

      if (Platform.OS === "ios") {
        if (uri.startsWith("file://")) return uri.replace("file://", "");
      }

      return uri;
    } catch (err) {
      console.log("prepareUriForUpload error:", err);
      return uri;
    }
  };

  const handleSubmit = async () => {
    if (!name || !mobileNumber || !upiId) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not authenticated.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("mobileNumber", String(mobileNumber));
      formData.append("upiId", upiId);
      formData.append("status", status);
      formData.append("about", about || "");

      if (profileImageUri && !profileImageUri.startsWith("http")) {
        const prepared = await prepareUriForUpload(profileImageUri);
        const filename = `profile_${Date.now()}.jpg`;
        formData.append("profilePicture", {
          uri: Platform.OS === "android" ? prepared : `file://${prepared}`,
          name: filename,
          type: "image/jpeg",
        });
      }

      if (farmImages && Array.isArray(farmImages) && farmImages.length > 0) {
        const newImages = farmImages.filter((img) => {
          const uri = typeof img === "string" ? img : img?.uri;
          return (
            uri && !uri.startsWith("http://") && !uri.startsWith("https://")
          );
        });

        for (let i = 0; i < newImages.length; i++) {
          try {
            const rawUri =
              typeof newImages[i] === "string"
                ? newImages[i]
                : newImages[i]?.uri;
            const prepared = await prepareUriForUpload(rawUri);
            const filename = `farm_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}.jpg`;
            const imageFile = {
              uri: Platform.OS === "android" ? prepared : `file://${prepared}`,
              name: filename,
              type: "image/jpeg",
            };
            formData.append("farmImages", imageFile);
          } catch (imgErr) {
            console.log(`Error processing farm image ${i + 1}:`, imgErr);
          }
        }
      }

      const response = await axios({
        method: "PUT",
        url: `${API_BASE}/api/vendor/profile`,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (response.data?.success) {
        const payload =
          response.data?.user || response.data?.data || response.data;
        onUpdate({
          name: payload?.name || name,
          mobileNumber: payload?.mobileNumber || mobileNumber,
          upiId: payload?.upiId || upiId,
          status: payload?.status || status,
          about: payload?.about || about,
          profileImageUri:
            payload?.profilePicture || payload?.profileImage || profileImageUri,
          farmImages: Array.isArray(payload?.farmImages)
            ? payload.farmImages
            : payload?.farmImages
              ? [payload.farmImages]
              : (farmImages || []).map((i) =>
                  typeof i === "string" ? i : i?.uri,
                ),
        });

        Alert.alert("Success", "Profile updated successfully!");
        onClose();
      } else {
        Alert.alert("Error", response.data?.message || "Something went wrong!");
      }
    } catch (err) {
      console.log("Upload error:", err);
      if (err?.response) {
        Alert.alert(
          "Server Error",
          err.response.data?.message || `Status ${err.response.status}`,
        );
      } else if (err?.code === "ECONNABORTED") {
        Alert.alert(
          "Timeout",
          "Upload took too long. Try fewer or smaller images.",
        );
      } else if (err?.message?.toLowerCase().includes("network")) {
        Alert.alert(
          "Network Error",
          "Check your internet connection and try again.",
        );
      } else {
        Alert.alert(
          "Error",
          err?.message || "Upload failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const selectStatus = (value) => {
    SetStatus(value);
    setShowStatusPicker(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={modalStyles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={modalStyles.modalContainer}
          onStartShouldSetResponder={() => true}
        >
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={onClose} style={modalStyles.headerIcon}>
              <Image
                source={require("../../assets/via-farm-img/icons/groupArrow.png")}
                style={{ width: scale(32), height: scale(32) }}
              />
            </TouchableOpacity>
            <Text allowFontScaling={false} style={modalStyles.headerTitle}>
              Edit Details
            </Text>
            <View style={{ width: moderateScale(40) }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollViewContent}
          >
            <Text allowFontScaling={false} style={modalStyles.smallText}>
              * marks important fields
            </Text>

            <View style={modalStyles.labelContainer}>
              <Text allowFontScaling={false} style={modalStyles.label}>
                Profile Picture
              </Text>
              <TouchableOpacity
                style={modalStyles.profileUploadBox}
                onPress={pickImage}
              >
                {profileImageUri ? (
                  <Image
                    source={{ uri: profileImageUri }}
                    style={modalStyles.uploadedImage}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={moderateScale(30)}
                      color="#ccc"
                    />
                    <Text
                      allowFontScaling={false}
                      style={modalStyles.chooseFileText}
                    >
                      Choose a file
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={modalStyles.labelContainer}>
              <Text allowFontScaling={false} style={modalStyles.label}>
                Name *
              </Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="Your Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                allowFontScaling={false}
              />
            </View>

            <View style={modalStyles.labelContainer}>
              <Text allowFontScaling={false} style={modalStyles.label}>
                Mobile No. *
              </Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="9999999999"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                allowFontScaling={false}
              />
            </View>

            <View style={modalStyles.labelContainer}>
              <Text allowFontScaling={false} style={modalStyles.label}>
                UPI ID *
              </Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. yourname@bank"
                placeholderTextColor="#999"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                allowFontScaling={false}
              />
            </View>

            {/* Status dropdown */}
            <View style={modalStyles.labelContainer}>
              <Text allowFontScaling={false} style={modalStyles.label}>
                Status
              </Text>
              <View>
                <TouchableOpacity
                  onPress={() => setShowStatusPicker((prev) => !prev)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: moderateScale(12),
                    paddingVertical: moderateScale(10),
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: moderateScale(8),
                    backgroundColor: "#fff",
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{ color: "#333", fontSize: normalizeFont(12) }}
                  >
                    {status || "Select status"}
                  </Text>
                  <Ionicons
                    name={showStatusPicker ? "chevron-up" : "chevron-down"}
                    size={moderateScale(18)}
                    color="#666"
                  />
                </TouchableOpacity>

                {showStatusPicker && (
                  <View
                    style={{
                      marginTop: moderateScale(6),
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: moderateScale(8),
                      backgroundColor: "#fff",
                      zIndex: 9999,
                      elevation: 6,
                      overflow: "hidden",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => selectStatus("Active")}
                      style={{
                        padding: moderateScale(12),
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{ color: "#222", fontSize: normalizeFont(12) }}
                      >
                        Active
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => selectStatus("Inactive")}
                      style={{ padding: moderateScale(12) }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{ color: "#222", fontSize: normalizeFont(12) }}
                      >
                        Inactive
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={modalStyles.labelContainer}>
              <Text allowFontScaling={false} style={modalStyles.label}>
                About
              </Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="tell us more about yourself"
                placeholderTextColor="#999"
                value={about}
                onChangeText={SetAbout}
                autoCapitalize="none"
                multiline
                allowFontScaling={false}
              />
            </View>

            {/* Multi-image */}
            <View style={{ marginBottom: moderateScale(12) }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: normalizeFont(14),
                  fontWeight: "600",
                  marginBottom: moderateScale(8),
                }}
              >
                Add Images *
              </Text>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: moderateScale(12),
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  opacity:
                    loading || (farmImages && farmImages.length >= 5) ? 0.6 : 1,
                }}
                onPress={ImageFarm}
                disabled={loading || (farmImages && farmImages.length >= 5)}
              >
                <Ionicons
                  name="folder-outline"
                  size={moderateScale(26)}
                  color="#777"
                />
                <Text
                  allowFontScaling={false}
                  style={{
                    marginLeft: moderateScale(12),
                    color: "#333",
                    fontSize: normalizeFont(12),
                  }}
                >
                  {farmImages && farmImages.length >= 5
                    ? "Maximum 5 images reached"
                    : `Add images (${farmImages ? farmImages.length : 0}/5)`}
                </Text>
              </TouchableOpacity>

              {farmImages && farmImages.length > 0 && (
                <ScrollView
                  horizontal
                  style={{ marginVertical: moderateScale(8) }}
                >
                  {farmImages.map((imgObj, idx) => (
                    <View
                      key={(imgObj.uri || "") + idx}
                      style={{
                        marginRight: moderateScale(8),
                        position: "relative",
                        width: scale(90),
                        height: scale(90),
                        borderRadius: 8,
                        overflow: "hidden",
                        backgroundColor: "#f3f3f3",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={{ uri: imgObj.uri }}
                        style={{ width: "100%", height: "100%" }}
                      />
                      {!loading && (
                        <TouchableOpacity
                          onPress={() => removeImage(idx)}
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            backgroundColor: "#fff",
                            borderRadius: moderateScale(14),
                            width: moderateScale(28),
                            height: moderateScale(28),
                            alignItems: "center",
                            justifyContent: "center",
                            elevation: 3,
                          }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={moderateScale(20)}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
            {/* end multi-image */}
          </ScrollView>

          <TouchableOpacity
            style={modalStyles.updateButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color="#fff"
                style={{ marginRight: moderateScale(8) }}
              />
            ) : (
              <Ionicons
                name="reload-outline"
                size={moderateScale(18)}
                color="#fff"
                style={{ marginRight: moderateScale(8) }}
              />
            )}
            <Text allowFontScaling={false} style={modalStyles.updateButtonText}>
              {loading ? "Updating..." : "Update Details"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ---------------- EditLocationModal (Updated Design) ----------------

const EditLocationModal = ({ visible, onClose, onSubmit, initialData }) => {
  const [pinCode, setPinCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [deliveryRadius, setDeliveryRadius] = useState("");
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setPinCode(initialData.pinCode || "");
      setHouseNumber(initialData.houseNumber || "");
      setLocality(initialData.locality || "");
      setCity(initialData.city || "");
      setDistrict(initialData.district || "");
      setState(initialData.state || "");
      setCountry(initialData.country || "");
      setDeliveryRadius(
        String(initialData.deliveryRadius || "").replace("km", ""),
      );
      setLatitude(initialData.latitude || null);
      setLongitude(initialData.longitude || null);
    }
  }, [visible, initialData]);

  /* =============================
     📍 FETCH CURRENT LOCATION
  ============================== */
  const handleUseCurrentLocation = async () => {
    try {
      setLocLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission denied");
        setLocLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      setLatitude(latitude);
      setLongitude(longitude);

      // Reverse geocoding (address auto-fill)
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address?.length > 0) {
        const a = normalizeReverseGeocodeAddress(
          address[0],
          latitude,
          longitude,
        );
        setPinCode(a.pinCode || "");
        setHouseNumber(a.houseNumber || houseNumber);
        setLocality(a.locality || "");
        setCity(a.city || "");
        setDistrict(a.district || "");
        setState(a.state || "");
        setCountry(a.country || "");
      }

      Alert.alert("Success", "Current location fetched!");
    } catch (error) {
      console.log("Location Error:", error);
      Alert.alert("Error", "Unable to fetch current location");
    } finally {
      setLocLoading(false);
    }
  };

  /* =============================
     ✅ SUBMIT LOCATION
  ============================== */
  const handleSubmit = async () => {
    if (
      !pinCode ||
      !houseNumber ||
      !locality ||
      !city ||
      !district ||
      !state ||
      !country
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const radiusInt = parseInt(deliveryRadius, 10);
    if (isNaN(radiusInt) || radiusInt < 0 || radiusInt > 10000) {
      Alert.alert("Error", "Delivery radius must be between 0 and 10,000");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const body = createLocationPayload(
        {
          pinCode,
          houseNumber,
          locality,
          city,
          district,
          state,
          country,
          latitude: latitude || 0,
          longitude: longitude || 0,
        },
        { deliveryRadius: radiusInt },
      );

      const response = await axios.put(
        `${API_BASE}/api/vendor/update-location`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.success) {
        Alert.alert("Success", "Location updated!");
        onSubmit(normalizeApiLocation(response.data));
        onClose();
      } else {
        Alert.alert("Error", response.data?.message || "Failed");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={modalStyles.modalOverlay}
      >
        <View
          style={modalStyles.modalContainer}
          onStartShouldSetResponder={() => true}
        >
          {/* HEADER */}
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Image
                source={require("../../assets/via-farm-img/icons/groupArrow.png")}
                style={{ width: scale(32), height: scale(32) }}
              />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>Edit Location & Charges</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ paddingHorizontal: moderateScale(20) }}
          >
            <Text style={modalStyles.sectionTitle}>Your Address</Text>

            {/* USE CURRENT LOCATION */}
            <TouchableOpacity
              style={modalStyles.locationButton}
              onPress={handleUseCurrentLocation}
              disabled={locLoading}
            >
              {locLoading ? (
                <ActivityIndicator color="#00B0FF" />
              ) : (
                <Ionicons name="locate" size={18} color="#00B0FF" />
              )}
              <Text style={modalStyles.locationButtonText}>
                Use my current location
              </Text>
            </TouchableOpacity>

            <TextInput
              style={modalStyles.textInput}
              placeholder="Pin Code *"
              keyboardType="numeric"
              maxLength={6}
              value={pinCode}
              onChangeText={setPinCode}
            />

            <TextInput
              style={modalStyles.textInput}
              placeholder="House number / Street *"
              value={houseNumber}
              onChangeText={setHouseNumber}
            />

            <TextInput
              style={modalStyles.textInput}
              placeholder="Locality *"
              value={locality}
              onChangeText={setLocality}
            />

            <View style={modalStyles.row}>
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="City *"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="District *"
                value={district}
                onChangeText={setDistrict}
              />
            </View>

            <View style={modalStyles.row}>
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="State *"
                value={state}
                onChangeText={setState}
              />
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="Country *"
                value={country}
                onChangeText={setCountry}
              />
            </View>

            <Text style={modalStyles.sectionTitle}>Delivery Region</Text>

            <View style={modalStyles.deliveryRow}>
              <Text>Upto</Text>
              <TextInput
                style={modalStyles.deliveryInput}
                keyboardType="numeric"
                value={deliveryRadius}
                onChangeText={setDeliveryRadius}
              />
              <Text>km</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={modalStyles.updateButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading && <ActivityIndicator color="#fff" />}
            <Text style={modalStyles.updateButtonText}>
              {loading ? "Updating..." : "Update Details"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// export default EditLocationModal;

// ---------------- VendorProfile ----------------
const VendorProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [fullUser, setFullUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editLocationModalVisible, setEditLocationModalVisible] =
    useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const navigation = useNavigation();

  const getAvatarLetter = (name) =>
    name && name.length > 0 ? name.charAt(0).toUpperCase() : "U";

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const user = res.data.user;
        setFullUser(user);
        setUserInfo({
          name: user.name,
          status: user.status,
          rating: user.rating,
          phone: user.mobileNumber,
          upiId: user.upiId,
          image: user.profilePicture,
          address: normalizeApiLocation(user.address || {}),
        });

        await fetchVendorLocation(token);
      }
    } catch (error) {
      console.log("Error fetching profile:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorLocation = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/api/vendor/update-location`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const address = normalizeApiLocation(res.data);
        setUserInfo((prev) => (prev ? { ...prev, address } : prev));
      }
    } catch (error) {
      console.log("Error fetching vendor location:", error.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = (updatedData) => {
    setUserInfo((prev) => ({
      ...prev,
      name: updatedData.name,
      phone: updatedData.mobileNumber,
      upiId: updatedData.upiId,
      image: updatedData.profileImageUri || prev.image,
    }));
  };

  const handleLocationUpdate = (updatedAddress) => {
    setUserInfo((prev) => ({
      ...prev,
      address: updatedAddress,
    }));
  };

  const ratingText = userInfo?.rating ? String(userInfo.rating) : "New";
  const statusText = userInfo?.status || "Active";
  const primaryAddress =
    userInfo?.address?.fullAddress ||
    userInfo?.address?.locality ||
    userInfo?.address?.city ||
    userInfo?.address?.district ||
    userInfo?.address?.state ||
    userInfo?.address?.country ||
    "Set your business location";

  const ProfileMenuItem = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={moderateScale(20)} color="#666" />
        </View>
        <View style={styles.menuItemText}>
          <Text allowFontScaling={false} style={styles.menuItemTitle}>
            {title}
          </Text>
          <Text allowFontScaling={false} style={styles.menuItemSubtitle}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={moderateScale(16)} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.profile}>
        <TouchableOpacity onPress={goBack} style={styles.headerBackButton}>
          <Ionicons
            name="chevron-back"
            size={moderateScale(22)}
            color="#183153"
          />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          My Profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.profileSection}
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("VendorProfileView", { user: fullUser })
            }
          >
          <TouchableOpacity
            style={styles.ratingBadge}
            onPress={() =>
              navigation.navigate("VendorProfileView", { user: fullUser })
            }
          >
            <Ionicons
              name="star"
              size={moderateScale(14)}
              color="#F59E0B"
            />
            <Text allowFontScaling={false} style={styles.ratingText}>
              {ratingText}
            </Text>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.85}>
              {userInfo?.image ? (
                <Image
                  source={{ uri: userInfo.image }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text allowFontScaling={false} style={styles.avatarText}>
                    {getAvatarLetter(userInfo?.name)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text allowFontScaling={false} style={styles.userName}>
                {userInfo?.name || "Vendor Name"}
              </Text>
              <Text allowFontScaling={false} style={styles.userPhone}>
                +91 {userInfo?.phone || "Not added"}
              </Text>
              <Text allowFontScaling={false} style={styles.userPhone}>
                {userInfo?.upiId || "Add your UPI ID"}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.statusPill}>
                  <Ionicons
                    name="checkmark-circle"
                    size={moderateScale(14)}
                    color="#1F8A4C"
                  />
                  <Text allowFontScaling={false} style={styles.statusPillText}>
                    {statusText}
                  </Text>
                </View>
                <View style={styles.locationPill}>
                  <Ionicons
                    name="location-outline"
                    size={moderateScale(14)}
                    color="#183153"
                  />
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={styles.locationPillText}
                  >
                    {primaryAddress}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButtonContainer}
            onPress={() => setEditProfileModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons
              name="create-outline"
              size={moderateScale(16)}
              color="#0E7490"
            />
            <Text allowFontScaling={false} style={styles.editButtonText}>
              Edit
            </Text>
          </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderWrap}>
          <Text allowFontScaling={false} style={styles.sectionEyebrow}>
            Account
          </Text>
          <Text allowFontScaling={false} style={styles.sectionHeaderTitle}>
            Manage your business settings
          </Text>
        </View>

        <View style={styles.menuSection}>
          <ProfileMenuItem
            icon="location-outline"
            title="Manage Location & Charges"
            subtitle="Add/Edit your location"
            onPress={() => setEditLocationModalVisible(true)}
          />
          <ProfileMenuItem
            icon="pricetag-outline"
            title="My Coupons"
            subtitle="Your available discount coupons"
            onPress={() => navigation.navigate("MyCoupons")}
          />
          <ProfileMenuItem
            icon="language"
            title="Language"
            subtitle="Select your preferred language"
            onPress={() => navigation.navigate("Language")}
          />
          <ProfileMenuItem
            icon="headset-outline"
            title="Customer Support"
            subtitle="We are happy to assist you!"
            onPress={() => navigation.navigate("CustomerSupport")}
          />
          <ProfileMenuItem
            icon="shield-checkmark-outline"
            title="Privacy&Policy"
            subtitle="We care about your safety"
            onPress={() => navigation.navigate("Privacy&Policy")}
          />
          <ProfileMenuItem
            icon="information-circle-outline"
            title="About Us"
            subtitle="Get to know about us"
            onPress={() => navigation.navigate("AboutUs")}
          />
          <ProfileMenuItem
            icon="star-outline"
            title="Rate Us"
            subtitle="Rate your experience on Play Store"
            onPress={() => navigation.navigate("RateUs")}
          />
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await AsyncStorage.removeItem("userToken");
              await AsyncStorage.removeItem("userData");
              router.replace("/login");
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={moderateScale(18)}
              color="#fff"
              style={styles.logoutIcon}
            />
            <Text allowFontScaling={false} style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {userInfo && (
        <>
          <EditProfileModal
            visible={editProfileModalVisible}
            onClose={() => setEditProfileModalVisible(false)}
            initialData={userInfo}
            onUpdate={handleProfileUpdate}
          />

          <EditLocationModal
            visible={editLocationModalVisible}
            onClose={() => setEditLocationModalVisible(false)}
            initialData={userInfo?.address}
            onSubmit={handleLocationUpdate}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default VendorProfile;

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F6F0" },
  container: { flex: 1, backgroundColor: "#F6F6F0" },
  scrollContent: {
    paddingBottom: moderateScale(28),
  },

  profile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(22),
    paddingVertical: moderateScale(10),
    marginTop: moderateScale(2),
    backgroundColor: "#F6F6F0",
  },
  headerBackButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(24, 49, 83, 0.08)",
  },
  headerTitle: {
    fontWeight: "800",
    fontSize: normalizeFont(15),
    color: "#183153",
  },
  headerSpacer: {
    width: moderateScale(40),
  },
  heroCard: {
    marginHorizontal: scale(16),
    marginTop: moderateScale(6),
    backgroundColor: "#DFF3E4",
    borderRadius: moderateScale(24),
    padding: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(6) },
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(12),
    elevation: 3,
  },

  profileSection: {
    backgroundColor: "#fffef8",
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: "rgba(24, 49, 83, 0.08)",
  },

  ratingBadge: {
    position: "absolute",
    right: moderateScale(16),
    top: moderateScale(14),
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    zIndex: 2,
  },
  ratingText: {
    color: "#7C4A03",
    fontSize: normalizeFont(11),
    fontWeight: "700",
  },

  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: moderateScale(80),
  },

  avatarContainer: {
    width: moderateScale(78),
    height: moderateScale(78),
    borderRadius: moderateScale(39),
    backgroundColor: "#BEE3C6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarImage: {
    width: moderateScale(78),
    height: moderateScale(78),
    borderRadius: moderateScale(39),
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(39),
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: normalizeFont(28), fontWeight: "700", color: "#fff" },

  userInfo: { flex: 1, marginLeft: moderateScale(16) },
  userName: {
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: "#183153",
    paddingVertical: moderateScale(1),
  },
  userPhone: {
    fontSize: normalizeFont(11.5),
    color: "#5E6472",
    paddingVertical: moderateScale(1.5),
  },
  metaRow: {
    marginTop: moderateScale(8),
    gap: moderateScale(8),
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    backgroundColor: "#E8F7EC",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(999),
  },
  statusPillText: {
    color: "#1F8A4C",
    fontSize: normalizeFont(11),
    fontWeight: "700",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    backgroundColor: "#F5F7FA",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(12),
    maxWidth: "100%",
  },
  locationPillText: {
    flex: 1,
    color: "#435269",
    fontSize: normalizeFont(10.5),
    fontWeight: "600",
  },

  editButtonContainer: {
    position: "absolute",
    right: moderateScale(16),
    bottom: moderateScale(16),
    borderRadius: moderateScale(999),
    backgroundColor: "#E0F2FE",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  editButtonText: {
    color: "#0E7490",
    fontSize: normalizeFont(11.5),
    fontWeight: "700",
  },
  sectionHeaderWrap: {
    marginTop: moderateScale(18),
    marginHorizontal: scale(18),
    marginBottom: moderateScale(8),
  },
  sectionEyebrow: {
    fontSize: normalizeFont(10.5),
    fontWeight: "700",
    color: "#4CAF50",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: moderateScale(4),
  },
  sectionHeaderTitle: {
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: "#183153",
  },

  menuSection: {
    backgroundColor: "#fff",
    marginHorizontal: scale(14),
    marginTop: moderateScale(4),
    borderRadius: moderateScale(18),
    elevation: moderateScale(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(1) },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: "rgba(24, 49, 83, 0.06)",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(16),
    borderBottomWidth: scale(0.5),
    borderBottomColor: "#f0f0f0",
  },

  menuItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },

  iconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(50),
    backgroundColor: "#F4FAF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(14),
    borderWidth: scale(1),
    borderColor: "rgba(76, 175, 80, 0.14)",
  },

  menuItemText: { flex: 1 },
  menuItemTitle: {
    fontSize: normalizeFont(13),
    fontWeight: "700",
    color: "#22324A",
    marginBottom: moderateScale(2),
  },
  menuItemSubtitle: {
    fontSize: normalizeFont(11.5),
    color: "#6B7280",
    lineHeight: moderateScale(16),
  },

  logoutSection: {
    paddingHorizontal: scale(16),
    paddingVertical: moderateScale(22),
    marginBottom: moderateScale(20),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: moderateScale(20),
  },

  logoutButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    width: "78%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(18),
    borderRadius: moderateScale(16),
    elevation: moderateScale(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(3),
  },

  logoutIcon: { marginRight: moderateScale(8) },
  logoutText: { fontSize: normalizeFont(15), fontWeight: "600", color: "#fff" },
});

// ---------- Responsive modalStyles ----------
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: Math.max(moderateScale(200), height - moderateScale(80)),
    paddingBottom: moderateScale(15),
    borderTopWidth: moderateScale(2),
    borderLeftWidth: moderateScale(2),
    borderRightWidth: moderateScale(2),
    borderColor: "rgba(255, 202, 40, 1)",
    // padding:moderateScale(20)
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: scale(1),
    borderBottomColor: "#ddd",
  },
  headerIcon: {
    width: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: normalizeFont(22),
    color: "#4CAF50",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: "#333",
  },

  scrollViewContent: {
    paddingVertical: moderateScale(15),
    paddingHorizontal: scale(20),
  },
  smallText: {
    fontSize: normalizeFont(10),
    color: "#999",
    marginBottom: moderateScale(10),
  },

  sectionTitle: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(15),
    marginTop: moderateScale(5),
  },

  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
    borderWidth: scale(1),
    borderColor: "#e0e0e0",
  },
  locationButtonText: {
    flex: 1,
    fontSize: normalizeFont(12),
    color: "#00B0FF",
    marginLeft: moderateScale(10),
    fontWeight: "500",
  },

  labelContainer: { marginBottom: moderateScale(15) },
  label: {
    fontSize: normalizeFont(12),
    fontWeight: "500",
    color: "#333",
    marginBottom: moderateScale(8),
  },

  textInput: {
    borderWidth: scale(1),
    borderColor: "#e0e0e0",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    color: "#333",
    fontSize: normalizeFont(14),
    backgroundColor: "#f9f9f9",
    marginBottom: moderateScale(15),
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },
  halfInput: { flex: 1, marginBottom: moderateScale(15) },

  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: scale(2),
    borderColor: "#00B0FF",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(4),
    backgroundColor: "#fff",
    marginBottom: moderateScale(20),
  },
  uptoText: {
    fontSize: normalizeFont(12),
    color: "#666",
    marginRight: moderateScale(10),
  },
  deliveryInput: {
    flex: 1,
    fontSize: normalizeFont(14),
    color: "#333",
    paddingVertical: moderateScale(10),
    textAlign: "center",
  },
  kmsText: {
    fontSize: normalizeFont(12),
    color: "#666",
    marginLeft: moderateScale(10),
  },

  updateButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(10),
    marginTop: moderateScale(10),
  },
  updateButtonText: {
    color: "#fff",
    fontSize: normalizeFont(14),
    fontWeight: "600",
  },

  profileUploadBox: {
    borderWidth: scale(1),
    borderColor: "#ccc",
    borderRadius: moderateScale(12),
    height: moderateScale(150),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(8),
  },
  chooseFileText: {
    fontSize: normalizeFont(12),
    color: "#999",
    marginTop: moderateScale(8),
  },
});
