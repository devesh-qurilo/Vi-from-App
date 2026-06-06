export function getVendorStatus(user: any): string {
  return String(user?.vendorStatus || "")
    .trim()
    .toLowerCase();
}

export function getAuthenticatedRoute(user: any): string {
  if (!user) {
    return "/(auth)/login";
  }

  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  if (role === "vendor") {
    const vendorStatus = getVendorStatus(user);

    if (vendorStatus === "pending") {
      return "/vendor-pending";
    }

    if (vendorStatus === "rejected") {
      return "/vendor-rejected";
    }

    if (vendorStatus === "approved" || user?.isApproved === true) {
      return "/(vendors)/vendorprofile";
    }

    return "/(vendors)";
  }

  return "/(tabs)";
}
