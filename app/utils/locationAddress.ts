type AddressLike = Record<string, any>;

export const buildFullAddress = (address: AddressLike = {}) => {
  const parts = [
    address.houseNumber,
    address.locality,
    address.city,
    address.district,
    address.state,
    address.country,
    address.pinCode,
  ];

  return parts
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter(Boolean)
    .join(", ");
};

export const normalizeReverseGeocodeAddress = (
  geocodeAddress: AddressLike = {},
  latitude: number | null = null,
  longitude: number | null = null,
) => {
  const houseParts = [
    geocodeAddress.streetNumber,
    geocodeAddress.street || geocodeAddress.name,
  ]
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter(Boolean);

  const normalized = {
    country: geocodeAddress.country || "",
    state: geocodeAddress.region || "",
    district:
      geocodeAddress.district ||
      geocodeAddress.subregion ||
      geocodeAddress.region ||
      "",
    city:
      geocodeAddress.city ||
      geocodeAddress.subregion ||
      geocodeAddress.district ||
      "",
    pinCode: geocodeAddress.postalCode || "",
    houseNumber: houseParts.join(", "),
    locality:
      geocodeAddress.name ||
      geocodeAddress.street ||
      geocodeAddress.subregion ||
      "",
    latitude,
    longitude,
  };

  return {
    ...normalized,
    fullAddress:
      geocodeAddress.formattedAddress || buildFullAddress(normalized),
  };
};

export const normalizeApiLocation = (payload: AddressLike = {}) => {
  const data = payload?.data ?? payload ?? {};
  const rawAddress = data?.address ?? data ?? {};
  const coordinates =
    rawAddress?.location?.coordinates ?? data?.location?.coordinates ?? [];
  const [longitude, latitude] = coordinates;

  const normalized = {
    ...rawAddress,
    country: rawAddress?.country ?? data?.country ?? "",
    state: rawAddress?.state ?? data?.state ?? "",
    district: rawAddress?.district ?? data?.district ?? "",
    city: rawAddress?.city ?? data?.city ?? "",
    pinCode: rawAddress?.pinCode ?? data?.pinCode ?? "",
    houseNumber: rawAddress?.houseNumber ?? data?.houseNumber ?? "",
    locality: rawAddress?.locality ?? data?.locality ?? "",
    deliveryType: data?.deliveryType ?? rawAddress?.deliveryType,
    deliveryRadius: data?.deliveryRadius ?? rawAddress?.deliveryRadius,
    latitude: rawAddress?.latitude ?? data?.latitude ?? latitude ?? null,
    longitude: rawAddress?.longitude ?? data?.longitude ?? longitude ?? null,
  };

  return {
    ...normalized,
    fullAddress:
      rawAddress?.fullAddress ??
      data?.fullAddress ??
      buildFullAddress(normalized),
  };
};

export const createLocationPayload = (
  address: AddressLike = {},
  options: AddressLike = {},
) => {
  const payload: AddressLike = {
    houseNumber: String(address.houseNumber || "").trim(),
    latitude: address.latitude,
    longitude: address.longitude,
  };

  [
    "country",
    "state",
    "district",
    "city",
    "pinCode",
    "locality",
    "fullAddress",
  ].forEach((key) => {
    const value = address[key];
    if (value != null && String(value).trim()) {
      payload[key] = String(value).trim();
    }
  });

  payload.fullAddress = String(
    address.fullAddress || buildFullAddress(address),
  ).trim();

  if (
    options.deliveryRadius != null &&
    String(options.deliveryRadius).trim()
  ) {
    payload.deliveryRegion = `${parseInt(options.deliveryRadius, 10)}km`;
  }

  return payload;
};
