type CityOption = {
  name: string;
  pinCodes: string[];
};

type DistrictOption = {
  name: string;
  cities: CityOption[];
};

type StateOption = {
  name: string;
  districts: DistrictOption[];
};

export const INDIA_COUNTRY = "India";

export const INDIA_LOCATION_OPTIONS: StateOption[] = [
  {
    name: "Karnataka",
    districts: [
      {
        name: "Bengaluru Urban",
        cities: [
          { name: "Bengaluru", pinCodes: ["560001", "560002", "560034"] },
          { name: "Yelahanka", pinCodes: ["560064"] },
        ],
      },
      {
        name: "Mysuru",
        cities: [{ name: "Mysuru", pinCodes: ["570001", "570004"] }],
      },
    ],
  },
  {
    name: "Maharashtra",
    districts: [
      {
        name: "Mumbai City",
        cities: [{ name: "Mumbai", pinCodes: ["400001", "400002"] }],
      },
      {
        name: "Pune",
        cities: [{ name: "Pune", pinCodes: ["411001", "411004"] }],
      },
    ],
  },
  {
    name: "Delhi",
    districts: [
      {
        name: "New Delhi",
        cities: [{ name: "New Delhi", pinCodes: ["110001", "110003"] }],
      },
      {
        name: "South Delhi",
        cities: [{ name: "Saket", pinCodes: ["110017"] }],
      },
    ],
  },
  {
    name: "Tamil Nadu",
    districts: [
      {
        name: "Chennai",
        cities: [{ name: "Chennai", pinCodes: ["600001", "600004"] }],
      },
      {
        name: "Coimbatore",
        cities: [{ name: "Coimbatore", pinCodes: ["641001", "641002"] }],
      },
    ],
  },
  {
    name: "Telangana",
    districts: [
      {
        name: "Hyderabad",
        cities: [{ name: "Hyderabad", pinCodes: ["500001", "500081"] }],
      },
      {
        name: "Rangareddy",
        cities: [{ name: "Gachibowli", pinCodes: ["500032"] }],
      },
    ],
  },
  {
    name: "Gujarat",
    districts: [
      {
        name: "Ahmedabad",
        cities: [{ name: "Ahmedabad", pinCodes: ["380001", "380015"] }],
      },
      {
        name: "Surat",
        cities: [{ name: "Surat", pinCodes: ["395003", "395007"] }],
      },
    ],
  },
  {
    name: "Rajasthan",
    districts: [
      {
        name: "Jaipur",
        cities: [{ name: "Jaipur", pinCodes: ["302001", "302004"] }],
      },
      {
        name: "Jodhpur",
        cities: [{ name: "Jodhpur", pinCodes: ["342001"] }],
      },
    ],
  },
  {
    name: "Uttar Pradesh",
    districts: [
      {
        name: "Lucknow",
        cities: [{ name: "Lucknow", pinCodes: ["226001", "226010"] }],
      },
      {
        name: "Gautam Buddha Nagar",
        cities: [{ name: "Noida", pinCodes: ["201301", "201304"] }],
      },
    ],
  },
  {
    name: "West Bengal",
    districts: [
      {
        name: "Kolkata",
        cities: [{ name: "Kolkata", pinCodes: ["700001", "700019"] }],
      },
      {
        name: "Howrah",
        cities: [{ name: "Howrah", pinCodes: ["711101"] }],
      },
    ],
  },
  {
    name: "Kerala",
    districts: [
      {
        name: "Ernakulam",
        cities: [{ name: "Kochi", pinCodes: ["682001", "682024"] }],
      },
      {
        name: "Thiruvananthapuram",
        cities: [{ name: "Thiruvananthapuram", pinCodes: ["695001"] }],
      },
    ],
  },
];

const unique = (items: string[]) => [...new Set(items.filter(Boolean))];

const includeCurrentValue = (items: string[], currentValue?: string) => {
  if (!currentValue || items.includes(currentValue)) return items;
  return [currentValue, ...items];
};

export const getCountryOptions = (currentValue?: string) =>
  includeCurrentValue([INDIA_COUNTRY], currentValue);

export const getStateOptions = (currentValue?: string) =>
  includeCurrentValue(
    INDIA_LOCATION_OPTIONS.map((state) => state.name),
    currentValue,
  );

export const getDistrictOptions = (stateName?: string, currentValue?: string) => {
  const state = INDIA_LOCATION_OPTIONS.find((item) => item.name === stateName);
  return includeCurrentValue(
    state?.districts.map((district) => district.name) ?? [],
    currentValue,
  );
};

export const getCityOptions = (
  stateName?: string,
  districtName?: string,
  currentValue?: string,
) => {
  const state = INDIA_LOCATION_OPTIONS.find((item) => item.name === stateName);
  const district = state?.districts.find((item) => item.name === districtName);
  return includeCurrentValue(
    district?.cities.map((city) => city.name) ?? [],
    currentValue,
  );
};

export const getPinCodeOptions = (
  stateName?: string,
  districtName?: string,
  cityName?: string,
  currentValue?: string,
) => {
  const state = INDIA_LOCATION_OPTIONS.find((item) => item.name === stateName);
  const district = state?.districts.find((item) => item.name === districtName);
  const city = district?.cities.find((item) => item.name === cityName);
  return includeCurrentValue(unique(city?.pinCodes ?? []), currentValue);
};
