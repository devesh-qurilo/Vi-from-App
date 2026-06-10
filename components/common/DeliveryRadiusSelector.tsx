import { moderateScale, normalizeFont } from "@/app/Responsive";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const DELIVERY_RADIUS_OPTIONS = [25, 50, 75, 100, 150, 200, 250, 300];

type DeliveryRadiusSelectorProps = {
  value: string | number;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const DeliveryRadiusSelector = ({
  value,
  onChange,
  disabled = false,
}: DeliveryRadiusSelectorProps) => {
  const numericValue = Number(value) || DELIVERY_RADIUS_OPTIONS[0];
  const activeIndex = Math.max(
    0,
    DELIVERY_RADIUS_OPTIONS.findIndex((item) => item === numericValue),
  );

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.headerRow}>
        <Text allowFontScaling={false} style={styles.label}>
          Delivery Region
        </Text>
        <Text allowFontScaling={false} style={styles.valueText}>
          Upto {numericValue} km
        </Text>
      </View>

      <View style={styles.trackWrap}>
        <View style={styles.track} />
        <View
          style={[
            styles.activeTrack,
            {
              width: `${(activeIndex / (DELIVERY_RADIUS_OPTIONS.length - 1)) * 100}%`,
            },
          ]}
        />
        <View style={styles.tickRow}>
          {DELIVERY_RADIUS_OPTIONS.map((radius, index) => {
            const selected = radius === numericValue;
            const filled = index <= activeIndex;

            return (
              <TouchableOpacity
                key={radius}
                activeOpacity={0.8}
                style={styles.tickTarget}
                onPress={() => onChange(String(radius))}
                disabled={disabled}
              >
                <View
                  style={[
                    styles.tick,
                    filled && styles.filledTick,
                    selected && styles.selectedTick,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionRow}
      >
        {DELIVERY_RADIUS_OPTIONS.map((radius) => {
          const selected = radius === numericValue;

          return (
            <TouchableOpacity
              key={radius}
              activeOpacity={0.8}
              style={[styles.optionChip, selected && styles.selectedChip]}
              onPress={() => onChange(String(radius))}
              disabled={disabled}
            >
              <Text
                allowFontScaling={false}
                style={[styles.optionText, selected && styles.selectedText]}
              >
                {radius}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDE7E9",
    borderRadius: moderateScale(8),
    padding: moderateScale(14),
    marginBottom: moderateScale(15),
  },
  disabled: {
    opacity: 0.65,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
  },
  label: {
    fontSize: normalizeFont(12),
    color: "#374151",
    fontWeight: "700",
  },
  valueText: {
    fontSize: normalizeFont(12),
    color: "#0E7490",
    fontWeight: "700",
  },
  trackWrap: {
    height: moderateScale(28),
    justifyContent: "center",
    marginBottom: moderateScale(8),
  },
  track: {
    position: "absolute",
    left: moderateScale(8),
    right: moderateScale(8),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: "#E5E7EB",
  },
  activeTrack: {
    position: "absolute",
    left: moderateScale(8),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: "#0E7490",
  },
  tickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tickTarget: {
    width: moderateScale(20),
    height: moderateScale(28),
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#fff",
  },
  filledTick: {
    backgroundColor: "#7DD3FC",
  },
  selectedTick: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: "#0E7490",
  },
  optionRow: {
    gap: moderateScale(8),
    paddingTop: moderateScale(4),
  },
  optionChip: {
    minWidth: moderateScale(48),
    paddingVertical: moderateScale(7),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  selectedChip: {
    backgroundColor: "#ECFEFF",
    borderColor: "#0E7490",
  },
  optionText: {
    fontSize: normalizeFont(12),
    color: "#4B5563",
    fontWeight: "600",
  },
  selectedText: {
    color: "#0E7490",
    fontWeight: "800",
  },
});

export default DeliveryRadiusSelector;
