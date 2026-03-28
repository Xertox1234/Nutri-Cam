/** Default FlatList virtualization props for long-scrolling screens */
export const FLATLIST_DEFAULTS = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 15,
  windowSize: 5,
} as const;
