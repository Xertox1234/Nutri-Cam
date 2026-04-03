/**
 * Multer upload configuration for image uploads.
 */
import multer from "multer";

/** Factory for image upload multer configs with consistent fileFilter. */
export function createImageUpload(maxSizeBytes: number) {
  return multer({
    limits: { fileSize: maxSizeBytes },
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and WebP allowed."));
      }
    },
  });
}

// Multer configuration for photo uploads (1MB limit for compressed images)
export const upload = createImageUpload(1 * 1024 * 1024);
