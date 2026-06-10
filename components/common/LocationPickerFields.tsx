import { moderateScale, normalizeFont } from "@/app/Responsive";
import {
  getCityOptions,
  getCountryOptions,
  getDistrictOptions,
  getPinCodeOptions,
  getStateOptions,
  INDIA_COUNTRY,
} from "@/app/utils/indiaLocationOptions";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type LocationPickerFieldsProps = {
  country: string;
  state: string;
  district: string;
  city: string;
  pinCode: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPinCodeChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
};

const SelectField = ({
  value,
  label,
  options,
  onValueChange,
  enabled,
  icon,
}: {
  value: string;
  label: string;
  options: string[];
  onValueChange: (value: string) => void;
  enabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}) => {
  const [visible, setVisible] = useState(false);
  const canOpen = enabled && options.length > 0;

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.selectBox, !canOpen && styles.disabledSelect]}
        onPress={() => canOpen && setVisible(true)}
        disabled={!canOpen}
      >
        <View style={styles.selectIcon}>
          <Ionicons
            name={icon}
            size={moderateScale(17)}
            color={canOpen ? "#0E7490" : "#9CA3AF"}
          />
        </View>
        <View style={styles.selectTextWrap}>
          <Text allowFontScaling={false} style={styles.selectLabel}>
            {label}
          </Text>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.selectValue, !value && styles.placeholderText]}
          >
            {value || `Select ${label.toLowerCase()}`}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={moderateScale(18)}
          color={canOpen ? "#6B7280" : "#CBD5E1"}
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <View
            style={styles.sheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text allowFontScaling={false} style={styles.sheetTitle}>
                Select {label}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
              >
                <Ionicons name="close" size={moderateScale(20)} color="#111827" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.optionList}
              renderItem={({ item }) => {
                const selected = item === value;

                return (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={[
                      styles.optionRow,
                      selected && styles.selectedOptionRow,
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.optionText,
                        selected && styles.selectedOptionText,
                      ]}
                    >
                      {item}
                    </Text>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(19)}
                        color="#0E7490"
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const LocationPickerFields = ({
  country,
  state,
  district,
  city,
  pinCode,
  onCountryChange,
  onStateChange,
  onDistrictChange,
  onCityChange,
  onPinCodeChange,
  disabled = false,
  compact = false,
}: LocationPickerFieldsProps) => {
  const countryOptions = useMemo(
    () => getCountryOptions(country || INDIA_COUNTRY),
    [country],
  );
  const stateOptions = useMemo(() => getStateOptions(state), [state]);
  const districtOptions = useMemo(
    () => getDistrictOptions(state, district),
    [state, district],
  );
  const cityOptions = useMemo(
    () => getCityOptions(state, district, city),
    [state, district, city],
  );
  const pinCodeOptions = useMemo(
    () => getPinCodeOptions(state, district, city, pinCode),
    [state, district, city, pinCode],
  );

  useEffect(() => {
    if (!country) onCountryChange(INDIA_COUNTRY);
  }, [country, onCountryChange]);

  const enabled = !disabled;
  const rowStyle = compact ? styles.compactRow : styles.row;

  return (
    <>
      <SelectField
        value={country || INDIA_COUNTRY}
        label="Country"
        options={countryOptions}
        onValueChange={(value) => {
          onCountryChange(value);
          onStateChange("");
          onDistrictChange("");
          onCityChange("");
          onPinCodeChange("");
        }}
        enabled={enabled}
        icon="earth-outline"
      />

      <View style={rowStyle}>
        <View style={styles.half}>
          <SelectField
            value={state}
            label="State"
            options={stateOptions}
            onValueChange={(value) => {
              onStateChange(value);
              onDistrictChange("");
              onCityChange("");
              onPinCodeChange("");
            }}
            enabled={enabled && !!country}
            icon="map-outline"
          />
        </View>
        <View style={styles.half}>
          <SelectField
            value={district}
            label="District"
            options={districtOptions}
            onValueChange={(value) => {
              onDistrictChange(value);
              onCityChange("");
              onPinCodeChange("");
            }}
            enabled={enabled && !!state}
            icon="navigate-outline"
          />
        </View>
      </View>

      <View style={rowStyle}>
        <View style={styles.half}>
          <SelectField
            value={city}
            label="City"
            options={cityOptions}
            onValueChange={(value) => {
              onCityChange(value);
              onPinCodeChange("");
            }}
            enabled={enabled && !!district}
            icon="business-outline"
          />
        </View>
        <View style={styles.half}>
          <SelectField
            value={pinCode}
            label="Pin Code"
            options={pinCodeOptions}
            onValueChange={onPinCodeChange}
            enabled={enabled && !!city}
            icon="mail-outline"
          />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: moderateScale(10),
  },
  compactRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  half: {
    flex: 1,
  },
  selectBox: {
    minHeight: moderateScale(58),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: moderateScale(8),
    backgroundColor: "#fff",
    marginBottom: moderateScale(15),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: moderateScale(4),
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  disabledSelect: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    opacity: 0.8,
  },
  selectIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFEFF",
    marginRight: moderateScale(9),
  },
  selectTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  selectLabel: {
    fontSize: normalizeFont(10),
    color: "#6B7280",
    marginBottom: moderateScale(2),
    fontWeight: "500",
  },
  selectValue: {
    fontSize: normalizeFont(13),
    color: "#111827",
    fontWeight: "600",
  },
  placeholderText: {
    color: "#9CA3AF",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  sheet: {
    maxHeight: "72%",
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(18),
    borderTopRightRadius: moderateScale(18),
    paddingHorizontal: moderateScale(18),
    paddingBottom: moderateScale(18),
  },
  sheetHandle: {
    width: moderateScale(42),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(12),
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  sheetTitle: {
    fontSize: normalizeFont(16),
    color: "#111827",
    fontWeight: "700",
  },
  closeButton: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  optionList: {
    paddingVertical: moderateScale(6),
  },
  optionRow: {
    minHeight: moderateScale(48),
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(11),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(6),
  },
  selectedOptionRow: {
    backgroundColor: "#ECFEFF",
  },
  optionText: {
    flex: 1,
    fontSize: normalizeFont(14),
    color: "#111827",
    marginRight: moderateScale(10),
  },
  selectedOptionText: {
    color: "#0E7490",
    fontWeight: "700",
  },
});

export default LocationPickerFields;
