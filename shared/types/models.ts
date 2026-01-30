// Client-side API response types
// These represent data as it comes over JSON (dates serialized as strings)

export interface ScannedItemResponse {
  id: number;
  userId?: string;
  barcode?: string | null;
  productName: string;
  brandName?: string | null;
  servingSize?: string | null;
  calories?: string | null;
  protein?: string | null;
  carbs?: string | null;
  fat?: string | null;
  fiber?: string | null;
  sugar?: string | null;
  sodium?: string | null;
  imageUrl?: string | null;
  scannedAt: string;
}

export interface PaginatedScannedItemsResponse {
  items: ScannedItemResponse[];
  total: number;
}
