import { useRef, useCallback, useState, useEffect } from "react";
import type {
  CameraRef,
  PhotoOptions,
  PhotoResult,
  BarcodeResult,
} from "../types";

export interface UseCameraOptions {
  onBarcodeScanned?: (result: BarcodeResult) => void;
  debounceMs?: number;
}

export interface UseCameraReturn {
  cameraRef: React.RefObject<CameraRef | null>;
  isScanning: boolean;
  lastScannedData: string | null;
  takePicture: (options?: PhotoOptions) => Promise<PhotoResult | null>;
  handleBarcodeScanned: (result: BarcodeResult) => void;
  resetScanning: () => void;
}

/**
 * Hook for camera operations with built-in barcode debouncing.
 * Uses refs for scanning state to avoid stale closures.
 */
export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { onBarcodeScanned, debounceMs = 2000 } = options;

  const cameraRef = useRef<CameraRef>(null);
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScanningRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const takePicture = useCallback(
    async (opts?: PhotoOptions): Promise<PhotoResult | null> => {
      if (!cameraRef.current) return null;
      return cameraRef.current.takePicture(opts);
    },
    [],
  );

  const handleBarcodeScanned = useCallback(
    (result: BarcodeResult) => {
      // Use ref for scanning check to avoid stale closure
      if (isScanningRef.current) return;
      if (lastScannedRef.current === result.data) return;

      isScanningRef.current = true;
      lastScannedRef.current = result.data;
      setLastScannedData(result.data);
      setIsScanning(true);

      // Clear any existing timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // Call the callback
      onBarcodeScanned?.(result);

      // Reset after debounce period
      scanTimeoutRef.current = setTimeout(() => {
        isScanningRef.current = false;
        setIsScanning(false);
        lastScannedRef.current = null;
      }, debounceMs);
    },
    [onBarcodeScanned, debounceMs],
  );

  const resetScanning = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    isScanningRef.current = false;
    setIsScanning(false);
    setLastScannedData(null);
    lastScannedRef.current = null;
  }, []);

  return {
    cameraRef,
    isScanning,
    lastScannedData,
    takePicture,
    handleBarcodeScanned,
    resetScanning,
  };
}
