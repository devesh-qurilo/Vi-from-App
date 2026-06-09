// AddProduct.jsx
import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Checkbox from "expo-checkbox";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_HOST = "https://vi-farm-backend.onrender.com";
const CATEGORY_API = "/api/admin/manage-app/categories";
const VARIETY_API = "/api/admin/variety";
const ADD_PRODUCT_API = "/api/vendor/products/add";

const api = axios.create({
  baseURL: API_HOST,
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      let token = await AsyncStorage.getItem("userToken");
      if (token) {
        token = token.replace(/^"|"$/g, "");
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Error reading token for request interceptor", err);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const AddProduct = ({ refreshprops }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [allIndiaDelivery, setAllIndiaDelivery] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weightPerPiece, setWeightPerPiece] = useState("");

  // dropdown states
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isVarietyDropdownOpen, setIsVarietyDropdownOpen] = useState(false);

  // data lists
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [allVarieties, setAllVarieties] = useState([]);
  const [varietyOptions, setVarietyOptions] = useState([]);
  const [varietyLoading, setVarietyLoading] = useState(false);

  const unitOptions = ["kg", "pc", "ltr", "dozen"];

  useEffect(() => {
    fetchCategoriesAndVarieties();
  }, []);

  useEffect(() => {
    if (!category) {
      setVarietyOptions(allVarieties.map((v) => v.name));
      setVariety("");
    } else {
      filterVarietiesForCategory(category);
    }
  }, [category, allVarieties]);

  const fetchCategoriesAndVarieties = async () => {
    setCategoriesLoading(true);
    setVarietyLoading(true);
    try {
      const [catRes, varRes] = await Promise.all([
        api.get(CATEGORY_API),
        api.get(VARIETY_API),
      ]);
      if (catRes.data && Array.isArray(catRes.data.categories)) {
        setCategories(catRes.data.categories);
      } else if (Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      } else {
        setCategories([]);
      }
      if (varRes.data && Array.isArray(varRes.data.varieties)) {
        setAllVarieties(varRes.data.varieties);
        setVarietyOptions(varRes.data.varieties.map((v) => v.name));
      } else if (Array.isArray(varRes.data)) {
        setAllVarieties(varRes.data);
        setVarietyOptions(varRes.data.map((v) => v.name));
      } else {
        setAllVarieties([]);
        setVarietyOptions([]);
      }
    } catch (error) {
      console.error("Error fetching categories/varieties:", error);
      const status = error?.response?.status;
      if (status === 401) {
        Alert.alert(
          "Unauthorized",
          "Session expired or invalid. Please login again.",
        );
      } else if (status === 403) {
        Alert.alert(
          "Forbidden",
          "You don't have permission to access categories/varieties.",
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to load categories/varieties. Please try again.",
        );
      }
      setCategories([]);
      setAllVarieties([]);
      setVarietyOptions([]);
    } finally {
      setCategoriesLoading(false);
      setVarietyLoading(false);
    }
  };

  const filterVarietiesForCategory = (selectedCategory) => {
    setVarietyLoading(true);
    try {
      const filtered = allVarieties.filter((v) => {
        if (!v || !v.category) return false;
        if (typeof v.category === "string") {
          return (
            v.category === selectedCategory ||
            v.category === selectedCategory._id
          );
        } else if (typeof v.category === "object") {
          return (
            (v.category.name &&
              v.category.name.toLowerCase() ===
                String(selectedCategory).toLowerCase()) ||
            (v.category._id && v.category._id === selectedCategory)
          );
        }
        return false;
      });

      const names = filtered.length > 0 ? filtered.map((f) => f.name) : [];
      setVarietyOptions(names);
      setVariety("");
    } catch (err) {
      console.error("Error filtering varieties:", err);
      setVarietyOptions([]);
      setVariety("");
    } finally {
      setVarietyLoading(false);
    }
  };

  const pickImages = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access gallery is required!",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.8,
      });

      const cancelled = result.canceled ?? result.cancelled ?? false;
      if (!cancelled) {
        const selected =
          result.assets || (result.selected ? result.selected : []);
        setImages((prev) => [...prev, ...selected]);
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Failed to select images.");
    }
  };

  const removeImage = (index) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    // basic validations
    if (!name.trim()) return Alert.alert("Error", "Please enter product name");
    if (!category.trim()) return Alert.alert("Error", "Please select category");
    if (!variety.trim()) return Alert.alert("Error", "Please select variety");
    if (!price.trim() || isNaN(price))
      return Alert.alert("Error", "Please enter valid price");
    if (!quantity.trim() || isNaN(quantity))
      return Alert.alert("Error", "Please enter valid quantity");
    if (!unit.trim())
      return Alert.alert("Error", "Please select unit (kg/pc/ltr/dozen)");

    const normalizedUnit = unit.trim().toLowerCase();
    if (normalizedUnit === "pc" && !weightPerPiece.trim()) {
      return Alert.alert("Error", "Please enter weight per piece for pc unit");
    }

    if (images.length === 0)
      return Alert.alert("Error", "Please add at least one image");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category.trim());
      formData.append("variety", variety.trim());
      formData.append("price", parseFloat(price.trim()));
      formData.append("quantity", parseFloat(quantity.trim()));
      formData.append("unit", normalizedUnit);
      formData.append("description", description.trim() || "");
      formData.append("allIndiaDelivery", allIndiaDelivery);

      if (normalizedUnit === "pc" && weightPerPiece.trim()) {
        formData.append("weightPerPiece", weightPerPiece.trim());
      }

      images.forEach((image, index) => {
        const uri = image.uri;
        const uriParts = uri.split("/");
        const fileName = uriParts[uriParts.length - 1] || `photo_${index}.jpg`;
        const fileType = fileName.split(".").pop().toLowerCase();
        const mimeType =
          fileType === "jpg" || fileType === "jpeg"
            ? "image/jpeg"
            : `image/${fileType}`;
        formData.append("images", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: fileName,
          type: mimeType,
        });
      });

      // send request
      const res = await api.post(ADD_PRODUCT_API, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        Alert.alert("Success", "Product added successfully!", [
          {
            text: "OK",
            onPress: () => {
              setModalVisible(false);
              resetForm();
              if (refreshprops) refreshprops();
            },
          },
        ]);
      } else {
        Alert.alert("Error", res.data?.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Add product error:", error);
      const status = error?.response?.status;
      let msg = "Failed to add product. Please try again.";
      if (status === 401) msg = "Session expired. Please login again.";
      else if (status === 413)
        msg = "Images are too large. Please select smaller images.";
      else if (status === 400) msg = error?.response?.data?.message || msg;
      else if (error?.code === "ECONNABORTED")
        msg = "Request timeout. Please try again.";

      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setUnit("");
    setVariety("");
    setQuantity("");
    setPrice("");
    setDescription("");
    setAllIndiaDelivery(false);
    setImages([]);
    setWeightPerPiece("");
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.content}>
          <Text allowFontScaling={false} style={styles.title}>
            Add a Product
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Showcase your fresh produce or handmade items
          </Text>
        </View>
        <View style={styles.iconContainer}>
          <Feather name="plus" size={22} color="#fff" />
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? moderateScale(8) : 0}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => !loading && setModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.dragHandle} />
                <View style={styles.header}>
                  <Pressable
                    style={styles.headerIconButton}
                    onPress={() => !loading && setModalVisible(false)}
                  >
                    <Ionicons name="arrow-back" size={22} color="#111827" />
                  </Pressable>
                  <Text allowFontScaling={false} style={styles.headerText}>
                    Add Product Details
                  </Text>
                  <View style={styles.headerIconButton} />
                </View>

              <Text allowFontScaling={false} style={styles.smallNote}>
                * marks important fields
              </Text>

              <Text allowFontScaling={false} style={styles.label}>
                Product Name *
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Kashmiri Apples"
                placeholderTextColor="#9ca3af"
                returnKeyType="next"
                editable={!loading}
              />

              <View style={styles.row}>
                <View style={[styles.fieldHalf, styles.dropdownField]}>
                  <Text allowFontScaling={false} style={styles.label}>
                    Category *
                  </Text>

                  <TouchableOpacity
                    style={[styles.input, styles.pickerInput]}
                    onPress={() => {
                      if (categoriesLoading) return;
                      setIsVarietyDropdownOpen(false);
                      setIsUnitDropdownOpen(false);
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    }}
                    disabled={loading || categoriesLoading}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: normalizeFont(12),
                        color: category ? "#000" : "#999",
                      }}
                    >
                      {category || "Select Category"}
                    </Text>
                    <Ionicons
                      name={
                        isCategoryDropdownOpen ? "chevron-up" : "chevron-down"
                      }
                      size={15}
                      color="#333"
                    />
                  </TouchableOpacity>

                  {isCategoryDropdownOpen && (
                    <View style={styles.dropdownBelowInput}>
                      {categoriesLoading ? (
                        <View style={styles.dropdownOption}>
                          <ActivityIndicator size="small" />
                        </View>
                      ) : categories.length > 0 ? (
                        <ScrollView
                          nestedScrollEnabled
                          style={{ maxHeight: moderateScale(150) }}
                        >
                          {categories.map((cat) => (
                            <TouchableOpacity
                              key={cat._id}
                              style={[
                                styles.dropdownOption,
                                category === cat.name &&
                                  styles.dropdownOptionSelected,
                              ]}
                              onPress={() => {
                                setCategory(cat.name);
                                setIsCategoryDropdownOpen(false);
                              }}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{ fontSize: normalizeFont(12) }}
                              >
                                {cat.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : (
                        <View style={styles.dropdownOption}>
                          <Text
                            allowFontScaling={false}
                            style={{ color: "#999" }}
                          >
                            No categories available
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View style={[styles.fieldHalf, styles.dropdownField]}>
                  <Text allowFontScaling={false} style={styles.label}>
                    Variety *
                  </Text>

                  <TouchableOpacity
                    style={[styles.input, styles.pickerInput]}
                    onPress={() => {
                      if (varietyLoading) return;
                      setIsCategoryDropdownOpen(false);
                      setIsUnitDropdownOpen(false);
                      setIsVarietyDropdownOpen(!isVarietyDropdownOpen);
                    }}
                    disabled={loading || varietyLoading}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: normalizeFont(12),
                        color: variety ? "#000" : "#999",
                      }}
                    >
                      {variety ||
                        (category ? "Select Variety" : "All Varieties")}
                    </Text>
                    <Ionicons
                      name={
                        isVarietyDropdownOpen ? "chevron-up" : "chevron-down"
                      }
                      size={15}
                      color="#333"
                    />
                  </TouchableOpacity>

                  {isVarietyDropdownOpen && (
                    <View style={styles.dropdownBelowInput}>
                      {varietyLoading ? (
                        <View style={styles.dropdownOption}>
                          <ActivityIndicator size="small" />
                        </View>
                      ) : varietyOptions.length > 0 ? (
                        <ScrollView
                          nestedScrollEnabled
                          style={{ maxHeight: moderateScale(150) }}
                        >
                          {varietyOptions.map((varName, idx) => (
                            <TouchableOpacity
                              key={`${varName}-${idx}`}
                              style={[
                                styles.dropdownOption,
                                variety === varName &&
                                  styles.dropdownOptionSelected,
                              ]}
                              onPress={() => {
                                setVariety(varName);
                                setIsVarietyDropdownOpen(false);
                              }}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{ fontSize: normalizeFont(12) }}
                              >
                                {varName}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : (
                        <View style={styles.dropdownOption}>
                          <Text
                            allowFontScaling={false}
                            style={{ color: "#999" }}
                          >
                            No varieties available
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.fieldThird}>
                  <Text allowFontScaling={false} style={styles.label}>
                    Price (₹) *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="eg.0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                    editable={!loading}
                  />
                </View>

                <View style={styles.fieldThird}>
                  <Text allowFontScaling={false} style={styles.label}>
                    Quantity *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="eg.0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                    editable={!loading}
                  />
                </View>

                <View style={[styles.fieldThird, styles.dropdownField]}>
                  <Text allowFontScaling={false} style={styles.label}>
                    Unit *
                  </Text>

                  <TouchableOpacity
                    style={[styles.input, styles.pickerInput]}
                    onPress={() => {
                      setIsCategoryDropdownOpen(false);
                      setIsVarietyDropdownOpen(false);
                      setIsUnitDropdownOpen(!isUnitDropdownOpen);
                    }}
                    disabled={loading}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: normalizeFont(12),
                        color: unit ? "#000" : "#999",
                      }}
                    >
                      {unit || "Select Unit"}
                    </Text>
                    <Ionicons
                      name={isUnitDropdownOpen ? "chevron-up" : "chevron-down"}
                      size={15}
                      color="#333"
                    />
                  </TouchableOpacity>

                  {isUnitDropdownOpen && (
                    <View style={styles.dropdownBelowInput}>
                      {unitOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownOption,
                            unit === opt && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setUnit(opt);
                            setIsUnitDropdownOpen(false);
                          }}
                        >
                          <Text
                            allowFontScaling={false}
                            style={{ fontSize: normalizeFont(12) }}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {(unit || "").toLowerCase() === "pc" && (
                <View>
                  <Text allowFontScaling={false} style={styles.label}>
                    Weight Per Piece *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={weightPerPiece}
                    onChangeText={setWeightPerPiece}
                    placeholder="e.g., 400g or 0.4kg"
                    placeholderTextColor="#9ca3af"
                    returnKeyType="next"
                    editable={!loading}
                  />
                  <Text allowFontScaling={false} style={styles.helperText}>
                    Enter weight of one piece (e.g., 400gm, 0.5kg)
                  </Text>
                </View>
              )}

              <Text allowFontScaling={false} style={styles.label}>
                Add Images *
              </Text>
              <TouchableOpacity
                style={[
                  styles.imageUpload,
                  (loading || images.length >= 5) && styles.imageUploadDisabled,
                ]}
                onPress={pickImages}
                disabled={loading || images.length >= 5}
              >
                <Ionicons name="folder-outline" size={28} color="#777" />
                <Text allowFontScaling={false} style={styles.imageUploadText}>
                  {images.length >= 5
                    ? "Maximum 5 images reached"
                    : `Add photos (${images.length}/5)`}
                </Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <ScrollView
                  horizontal
                  style={{ marginVertical: moderateScale(8) }}
                >
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: img.uri }}
                        style={styles.previewImage}
                      />
                      {!loading && (
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() => removeImage(idx)}
                        >
                          <Ionicons
                            name="close-circle"
                            size={22}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text allowFontScaling={false} style={styles.label}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { height: moderateScale(80), textAlignVertical: "top" },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Write product details here (optional)"
                placeholderTextColor="#9ca3af"
                returnKeyType="done"
                multiline
                editable={!loading}
              />

              <View style={styles.checkboxRow}>
                <Checkbox
                  value={allIndiaDelivery}
                  onValueChange={setAllIndiaDelivery}
                  disabled={loading}
                />
                <Text
                  allowFontScaling={false}
                  style={{
                    marginLeft: moderateScale(8),
                    fontSize: normalizeFont(11),
                  }}
                >
                  All India Delivery
                </Text>
              </View>

              <View style={styles.submitContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    loading && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={loading ? 1 : 0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={18} color="#fff" />
                      <Text allowFontScaling={false} style={styles.submitText}>
                        Add Product
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default AddProduct;

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: moderateScale(2),
    borderColor: "#22c55e",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    margin: moderateScale(12),
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.18,
    shadowRadius: moderateScale(4),
    elevation: 3,
    minHeight: moderateScale(56),
  },

  content: { flex: 1, paddingRight: moderateScale(10) },

  title: {
    fontSize: normalizeFont(15),
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: moderateScale(4),
  },

  subtitle: {
    fontSize: normalizeFont(11),
    color: "#6b7280",
  },

  iconContainer: {
    width: scale(52),
    height: scale(52),
    borderRadius: moderateScale(26),
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: moderateScale(3) },
    shadowOpacity: Platform.OS === "ios" ? 0.18 : 0.28,
    shadowRadius: moderateScale(6),
    elevation: 6,
    marginLeft: moderateScale(8),
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  keyboardAvoidingContainer: {
    flex: 1,
  },

  modalContainer: {
    maxHeight: "92%",
    width: "100%",
    backgroundColor: "#fbfffb",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingTop: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderWidth: moderateScale(1),
    borderColor: "#d7f3df",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -moderateScale(3) },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.14,
    shadowRadius: moderateScale(8),
    elevation: 16,
  },

  modalScrollContent: {
    paddingBottom: moderateScale(34),
  },

  dragHandle: {
    alignSelf: "center",
    width: moderateScale(40),
    height: moderateScale(4),
    borderRadius: moderateScale(10),
    backgroundColor: "#d1d5db",
    marginBottom: moderateScale(10),
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(6),
  },

  headerIconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    textAlign: "center",
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: "#111827",
  },

  smallNote: {
    fontSize: normalizeFont(11),
    color: "#6b7280",
    marginBottom: moderateScale(10),
  },

  label: {
    fontSize: normalizeFont(13),
    fontWeight: "600",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(6),
    color: "#1f2937",
  },

  input: {
    borderWidth: moderateScale(1),
    borderColor: "#d9e8d9",
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    backgroundColor: "#fff",
    marginBottom: moderateScale(8),
    fontSize: normalizeFont(14),
    minHeight: moderateScale(48),
    color: "#111827",
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: moderateScale(6),
    gap: moderateScale(8),
  },

  flex1: { flex: 1 },

  fieldHalf: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: moderateScale(142),
  },

  fieldThird: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: moderateScale(104),
  },

  dropdownField: {
    position: "relative",
    zIndex: 5,
  },

  pickerInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // gap: moderateScale(5),
  },

  dropdownBelowInput: {
    borderWidth: moderateScale(1),
    borderColor: "#22c55e",
    borderRadius: moderateScale(10),
    backgroundColor: "#fff",
    position: "absolute",
    top: moderateScale(70),
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: "hidden",
    maxHeight: moderateScale(250),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.12,
    shadowRadius: moderateScale(4),
    elevation: 12,
    paddingVertical: 0,
  },

  dropdownOption: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: moderateScale(0.5),
    borderBottomColor: "#eef6ee",
  },

  dropdownOptionSelected: {
    backgroundColor: "#f8faf8",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(12),
    paddingVertical: moderateScale(8),
  },

  submitContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
  },

  submitBtn: {
    backgroundColor: "#22c55e",
    width: "100%",
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(14),
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(6),
    alignContent: "center",
    marginTop: moderateScale(16),
    marginBottom: moderateScale(10),
    alignItems: "center",
    minHeight: moderateScale(48),
  },

  submitBtnDisabled: {
    opacity: 0.65,
  },

  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: normalizeFont(13),
  },

  imageUpload: {
    borderWidth: moderateScale(1),
    borderColor: "#d9e8d9",
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(4),
    backgroundColor: "#fff",
    minHeight: moderateScale(50),
  },

  imageUploadDisabled: {
    backgroundColor: "#f3f4f6",
    opacity: 0.8,
  },

  imageUploadText: {
    marginTop: moderateScale(6),
    color: "#555",
    fontSize: normalizeFont(12),
  },

  imagePreviewContainer: {
    position: "relative",
    marginRight: moderateScale(10),
    width: moderateScale(72),
    height: moderateScale(72),
  },

  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(8),
    backgroundColor: "#eee",
  },

  removeImageBtn: {
    position: "absolute",
    top: -moderateScale(6),
    right: -moderateScale(6),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
  },

  helperText: {
    fontSize: normalizeFont(11),
    color: "#777",
    marginBottom: moderateScale(6),
  },

  /* accessibility / touch targets */
  touchAreaLarge: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    minHeight: moderateScale(44),
    justifyContent: "center",
  },
});
