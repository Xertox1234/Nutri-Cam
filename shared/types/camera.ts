// expo-camera barcode types
export const expoBarcodeTypes = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "code93",
  "datamatrix",
  "qr",
] as const;

export type ExpoBarcodeType = (typeof expoBarcodeTypes)[number];

// react-native-vision-camera barcode types
export const visionCameraBarcodeTypes = [
  "ean-13",
  "ean-8",
  "upc-a",
  "upc-e",
  "code-128",
  "code-39",
  "code-93",
  "data-matrix",
  "qr",
] as const;

export type VisionCameraBarcodeType = (typeof visionCameraBarcodeTypes)[number];

/**
 * Type guard to check if a string is a valid VisionCameraBarcodeType.
 * Use this instead of type assertions for safer type narrowing.
 */
export function isVisionCameraBarcodeType(
  type: string,
): type is VisionCameraBarcodeType {
  return (visionCameraBarcodeTypes as readonly string[]).includes(type);
}

// Mapping between expo-camera and vision-camera barcode types
export const BARCODE_TYPE_MAP: Record<
  ExpoBarcodeType,
  VisionCameraBarcodeType
> = {
  ean13: "ean-13",
  ean8: "ean-8",
  upc_a: "upc-a",
  upc_e: "upc-e",
  code128: "code-128",
  code39: "code-39",
  code93: "code-93",
  datamatrix: "data-matrix",
  qr: "qr",
};

// Reverse mapping
export const BARCODE_TYPE_REVERSE_MAP: Record<
  VisionCameraBarcodeType,
  ExpoBarcodeType
> = {
  "ean-13": "ean13",
  "ean-8": "ean8",
  "upc-a": "upc_a",
  "upc-e": "upc_e",
  "code-128": "code128",
  "code-39": "code39",
  "code-93": "code93",
  "data-matrix": "datamatrix",
  qr: "qr",
};

// All barcode types are available to all users (no tier gating)
export const ALL_BARCODE_TYPES: ExpoBarcodeType[] = [...expoBarcodeTypes];

// Camera-agnostic barcode result
export interface BarcodeResult {
  data: string;
  type: ExpoBarcodeType;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Camera-agnostic photo result
export interface PhotoResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

// Camera permission status
export type CameraPermissionStatus =
  | "undetermined"
  | "granted"
  | "denied"
  | "restricted";

export interface CameraPermissionResult {
  status: CameraPermissionStatus;
  canAskAgain: boolean;
}
