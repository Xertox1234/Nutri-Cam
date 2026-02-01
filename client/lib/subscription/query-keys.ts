/**
 * Query key factory for TanStack Query subscription queries.
 *
 * Using a factory pattern ensures consistent cache invalidation
 * and enables fine-grained control over query dependencies.
 */
export const subscriptionKeys = {
  all: ["subscription"] as const,
  status: () => [...subscriptionKeys.all, "status"] as const,
  scanCount: () => [...subscriptionKeys.all, "scanCount"] as const,
  products: () => [...subscriptionKeys.all, "products"] as const,
};

/**
 * Type helper for query key inference.
 */
export type SubscriptionQueryKey =
  | ReturnType<typeof subscriptionKeys.status>
  | ReturnType<typeof subscriptionKeys.scanCount>
  | ReturnType<typeof subscriptionKeys.products>;
