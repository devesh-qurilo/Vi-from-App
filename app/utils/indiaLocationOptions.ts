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
  { name: "Andaman and Nicobar Islands", districts: [{ name: "South Andaman", cities: [{ name: "Port Blair", pinCodes: ["744101"] }] }] },
  { name: "Andhra Pradesh", districts: [{ name: "Visakhapatnam", cities: [{ name: "Visakhapatnam", pinCodes: ["530001"] }] }, { name: "Vijayawada", cities: [{ name: "Vijayawada", pinCodes: ["520001"] }] }] },
  { name: "Arunachal Pradesh", districts: [{ name: "Papum Pare", cities: [{ name: "Itanagar", pinCodes: ["791111"] }] }] },
  { name: "Assam", districts: [{ name: "Kamrup Metropolitan", cities: [{ name: "Guwahati", pinCodes: ["781001"] }] }, { name: "Dibrugarh", cities: [{ name: "Dibrugarh", pinCodes: ["786001"] }] }] },
  { name: "Bihar", districts: [{ name: "Patna", cities: [{ name: "Patna", pinCodes: ["800001"] }] }, { name: "Gaya", cities: [{ name: "Gaya", pinCodes: ["823001"] }] }] },
  { name: "Chandigarh", districts: [{ name: "Chandigarh", cities: [{ name: "Chandigarh", pinCodes: ["160017"] }] }] },
  { name: "Chhattisgarh", districts: [{ name: "Raipur", cities: [{ name: "Raipur", pinCodes: ["492001"] }] }, { name: "Bilaspur", cities: [{ name: "Bilaspur", pinCodes: ["495001"] }] }] },
  { name: "Dadra and Nagar Haveli and Daman and Diu", districts: [{ name: "Daman", cities: [{ name: "Daman", pinCodes: ["396210"] }] }, { name: "Dadra and Nagar Haveli", cities: [{ name: "Silvassa", pinCodes: ["396230"] }] }] },
  { name: "Delhi", districts: [{ name: "New Delhi", cities: [{ name: "New Delhi", pinCodes: ["110001", "110003"] }] }, { name: "South Delhi", cities: [{ name: "Saket", pinCodes: ["110017"] }] }] },
  { name: "Goa", districts: [{ name: "North Goa", cities: [{ name: "Panaji", pinCodes: ["403001"] }] }, { name: "South Goa", cities: [{ name: "Margao", pinCodes: ["403601"] }] }] },
  { name: "Gujarat", districts: [{ name: "Ahmedabad", cities: [{ name: "Ahmedabad", pinCodes: ["380001", "380015"] }] }, { name: "Surat", cities: [{ name: "Surat", pinCodes: ["395003", "395007"] }] }] },
  { name: "Haryana", districts: [{ name: "Gurugram", cities: [{ name: "Gurugram", pinCodes: ["122001"] }] }, { name: "Faridabad", cities: [{ name: "Faridabad", pinCodes: ["121001"] }] }] },
  { name: "Himachal Pradesh", districts: [{ name: "Shimla", cities: [{ name: "Shimla", pinCodes: ["171001"] }] }, { name: "Kangra", cities: [{ name: "Dharamshala", pinCodes: ["176215"] }] }] },
  { name: "Jammu and Kashmir", districts: [{ name: "Srinagar", cities: [{ name: "Srinagar", pinCodes: ["190001"] }] }, { name: "Jammu", cities: [{ name: "Jammu", pinCodes: ["180001"] }] }] },
  { name: "Jharkhand", districts: [{ name: "Ranchi", cities: [{ name: "Ranchi", pinCodes: ["834001"] }] }, { name: "East Singhbhum", cities: [{ name: "Jamshedpur", pinCodes: ["831001"] }] }] },
  { name: "Karnataka", districts: [{ name: "Bengaluru Urban", cities: [{ name: "Bengaluru", pinCodes: ["560001", "560002", "560034"] }, { name: "Yelahanka", pinCodes: ["560064"] }] }, { name: "Mysuru", cities: [{ name: "Mysuru", pinCodes: ["570001", "570004"] }] }] },
  { name: "Kerala", districts: [{ name: "Ernakulam", cities: [{ name: "Kochi", pinCodes: ["682001", "682024"] }] }, { name: "Thiruvananthapuram", cities: [{ name: "Thiruvananthapuram", pinCodes: ["695001"] }] }] },
  { name: "Ladakh", districts: [{ name: "Leh", cities: [{ name: "Leh", pinCodes: ["194101"] }] }, { name: "Kargil", cities: [{ name: "Kargil", pinCodes: ["194103"] }] }] },
  { name: "Lakshadweep", districts: [{ name: "Lakshadweep", cities: [{ name: "Kavaratti", pinCodes: ["682555"] }] }] },
  { name: "Madhya Pradesh", districts: [{ name: "Bhopal", cities: [{ name: "Bhopal", pinCodes: ["462001"] }] }, { name: "Indore", cities: [{ name: "Indore", pinCodes: ["452001"] }] }] },
  { name: "Maharashtra", districts: [{ name: "Mumbai City", cities: [{ name: "Mumbai", pinCodes: ["400001", "400002"] }] }, { name: "Pune", cities: [{ name: "Pune", pinCodes: ["411001", "411004"] }] }] },
  { name: "Manipur", districts: [{ name: "Imphal West", cities: [{ name: "Imphal", pinCodes: ["795001"] }] }] },
  { name: "Meghalaya", districts: [{ name: "East Khasi Hills", cities: [{ name: "Shillong", pinCodes: ["793001"] }] }] },
  { name: "Mizoram", districts: [{ name: "Aizawl", cities: [{ name: "Aizawl", pinCodes: ["796001"] }] }] },
  { name: "Nagaland", districts: [{ name: "Kohima", cities: [{ name: "Kohima", pinCodes: ["797001"] }] }, { name: "Dimapur", cities: [{ name: "Dimapur", pinCodes: ["797112"] }] }] },
  { name: "Odisha", districts: [{ name: "Khordha", cities: [{ name: "Bhubaneswar", pinCodes: ["751001"] }] }, { name: "Cuttack", cities: [{ name: "Cuttack", pinCodes: ["753001"] }] }] },
  { name: "Puducherry", districts: [{ name: "Puducherry", cities: [{ name: "Puducherry", pinCodes: ["605001"] }] }] },
  { name: "Punjab", districts: [{ name: "Ludhiana", cities: [{ name: "Ludhiana", pinCodes: ["141001"] }] }, { name: "Amritsar", cities: [{ name: "Amritsar", pinCodes: ["143001"] }] }] },
  { name: "Rajasthan", districts: [{ name: "Jaipur", cities: [{ name: "Jaipur", pinCodes: ["302001", "302004"] }] }, { name: "Jodhpur", cities: [{ name: "Jodhpur", pinCodes: ["342001"] }] }] },
  { name: "Sikkim", districts: [{ name: "Gangtok", cities: [{ name: "Gangtok", pinCodes: ["737101"] }] }] },
  { name: "Tamil Nadu", districts: [{ name: "Chennai", cities: [{ name: "Chennai", pinCodes: ["600001", "600004"] }] }, { name: "Coimbatore", cities: [{ name: "Coimbatore", pinCodes: ["641001", "641002"] }] }] },
  { name: "Telangana", districts: [{ name: "Hyderabad", cities: [{ name: "Hyderabad", pinCodes: ["500001", "500081"] }] }, { name: "Rangareddy", cities: [{ name: "Gachibowli", pinCodes: ["500032"] }] }] },
  { name: "Tripura", districts: [{ name: "West Tripura", cities: [{ name: "Agartala", pinCodes: ["799001"] }] }] },
  { name: "Uttar Pradesh", districts: [{ name: "Lucknow", cities: [{ name: "Lucknow", pinCodes: ["226001", "226010"] }] }, { name: "Gautam Buddha Nagar", cities: [{ name: "Noida", pinCodes: ["201301", "201304"] }] }] },
  { name: "Uttarakhand", districts: [{ name: "Dehradun", cities: [{ name: "Dehradun", pinCodes: ["248001"] }] }, { name: "Haridwar", cities: [{ name: "Haridwar", pinCodes: ["249401"] }] }] },
  { name: "West Bengal", districts: [{ name: "Kolkata", cities: [{ name: "Kolkata", pinCodes: ["700001", "700019"] }] }, { name: "Howrah", cities: [{ name: "Howrah", pinCodes: ["711101"] }] }] },
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
