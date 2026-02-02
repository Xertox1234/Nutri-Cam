import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  getInfoAsync,
  deleteAsync,
  type FileInfo,
} from "expo-file-system/legacy";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetSizeKB?: number;
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  sizeKB: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.7,
  targetSizeKB: 900, // Leave buffer under 1MB limit
};

/**
 * Compress an image for upload
 *
 * Uses expo-image-manipulator to resize and compress images.
 * Implements adaptive quality reduction if image is still too large.
 */
export async function compressImage(
  uri: string,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const { maxWidth, maxHeight, quality, targetSizeKB } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // First pass: resize and compress
  let result = await manipulateAsync(
    uri,
    [{ resize: { width: maxWidth, height: maxHeight } }],
    { compress: quality, format: SaveFormat.JPEG },
  );

  // Check file size
  const fileInfo = await getInfoAsync(result.uri);
  let sizeKB = (fileInfo.exists ? fileInfo.size : 0) / 1024;

  // Adaptive quality reduction if still too large
  if (sizeKB > targetSizeKB && quality > 0.3) {
    const newQuality = Math.max(0.3, quality * (targetSizeKB / sizeKB));

    result = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      { compress: newQuality, format: SaveFormat.JPEG },
    );

    const newFileInfo = await getInfoAsync(result.uri);
    sizeKB = (newFileInfo.exists ? newFileInfo.size : 0) / 1024;
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    sizeKB: Math.round(sizeKB * 100) / 100,
  };
}

/**
 * Clean up a compressed image file
 *
 * Call this after upload to free up temporary storage.
 * From institutional learning: useeffect-cleanup-memory-leak
 */
export async function cleanupImage(uri: string): Promise<void> {
  try {
    await deleteAsync(uri, { idempotent: true });
  } catch (error) {
    // Silently ignore cleanup errors
    console.warn("Image cleanup failed:", error);
  }
}

/**
 * Get image dimensions without loading full image
 */
export async function getImageDimensions(
  uri: string,
): Promise<{ width: number; height: number } | null> {
  try {
    // Use manipulate with no operations to get dimensions
    const result = await manipulateAsync(uri, [], {});
    return { width: result.width, height: result.height };
  } catch (error) {
    console.warn("Failed to get image dimensions:", error);
    return null;
  }
}

/**
 * Check if an image needs compression based on size
 */
export async function needsCompression(
  uri: string,
  maxSizeKB: number = 900,
): Promise<boolean> {
  try {
    const fileInfo = await getInfoAsync(uri);
    const sizeKB = (fileInfo.exists ? fileInfo.size : 0) / 1024;
    return sizeKB > maxSizeKB;
  } catch (error) {
    // If we can't check, assume it needs compression
    return true;
  }
}
