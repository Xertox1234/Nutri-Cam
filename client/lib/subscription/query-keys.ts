export const subscriptionKeys = {
  all: ["subscription"] as const,
  status: () => ["subscription", "status"] as const,
  scanCount: () => ["subscription", "scanCount"] as const,
  products: () => ["subscription", "products"] as const,
};
