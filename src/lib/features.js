export const features = {
  enableCoupons: true,
  enableLiveUpdates: true,
  enableNewMenu: true,
  maintenanceMode: false,
};

// Helper to check feature status (can be expanded to fetch from remote config later)
export const isFeatureEnabled = (featureName) => {
  return features[featureName] ?? false;
};
