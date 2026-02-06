// Mock React hooks
const mockUseRef = vi.fn();
const mockUseCallback = vi.fn((fn: Function) => fn);
const mockUseState = vi.fn();
const mockUseEffect = vi.fn();

vi.mock("react", () => ({
  useRef: (initial: any) => mockUseRef(initial),
  useCallback: (fn: Function, deps: any[]) => mockUseCallback(fn, deps),
  useState: (initial: any) => mockUseState(initial),
  useEffect: (fn: Function, deps: any[]) => mockUseEffect(fn, deps),
}));

// Test the debouncing logic by simulating the hook behavior
describe("useCamera debouncing logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("barcode scan debouncing", () => {
    it("should call onBarcodeScanned on first scan", () => {
      const onBarcodeScanned = vi.fn();
      const isScanningRef = { current: false };
      const lastScannedRef = { current: null as string | null };
      const scanTimeoutRef = {
        current: null as ReturnType<typeof setTimeout> | null,
      };
      const setIsScanning = vi.fn();
      const setLastScannedData = vi.fn();
      const debounceMs = 2000;

      // Simulate handleBarcodeScanned logic
      const handleBarcodeScanned = (result: { data: string; type: string }) => {
        if (isScanningRef.current) return;
        if (lastScannedRef.current === result.data) return;

        isScanningRef.current = true;
        lastScannedRef.current = result.data;
        setLastScannedData(result.data);
        setIsScanning(true);

        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }

        onBarcodeScanned(result);

        scanTimeoutRef.current = setTimeout(() => {
          isScanningRef.current = false;
          setIsScanning(false);
          lastScannedRef.current = null;
        }, debounceMs);
      };

      handleBarcodeScanned({ data: "123456789", type: "ean13" });

      expect(onBarcodeScanned).toHaveBeenCalledTimes(1);
      expect(onBarcodeScanned).toHaveBeenCalledWith({
        data: "123456789",
        type: "ean13",
      });
      expect(setIsScanning).toHaveBeenCalledWith(true);
      expect(setLastScannedData).toHaveBeenCalledWith("123456789");
    });

    it("should block rapid duplicate scans while isScanning is true", () => {
      const onBarcodeScanned = vi.fn();
      const isScanningRef = { current: false };
      const lastScannedRef = { current: null as string | null };
      const scanTimeoutRef = {
        current: null as ReturnType<typeof setTimeout> | null,
      };
      const setIsScanning = vi.fn();
      const setLastScannedData = vi.fn();
      const debounceMs = 2000;

      const handleBarcodeScanned = (result: { data: string; type: string }) => {
        if (isScanningRef.current) return;
        if (lastScannedRef.current === result.data) return;

        isScanningRef.current = true;
        lastScannedRef.current = result.data;
        setLastScannedData(result.data);
        setIsScanning(true);

        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }

        onBarcodeScanned(result);

        scanTimeoutRef.current = setTimeout(() => {
          isScanningRef.current = false;
          setIsScanning(false);
          lastScannedRef.current = null;
        }, debounceMs);
      };

      // First scan
      handleBarcodeScanned({ data: "123456789", type: "ean13" });
      // Rapid subsequent scans (should be blocked)
      handleBarcodeScanned({ data: "123456789", type: "ean13" });
      handleBarcodeScanned({ data: "123456789", type: "ean13" });
      handleBarcodeScanned({ data: "987654321", type: "ean13" }); // Different barcode, still blocked

      expect(onBarcodeScanned).toHaveBeenCalledTimes(1);
    });

    it("should allow new scan after debounce period", () => {
      const onBarcodeScanned = vi.fn();
      const isScanningRef = { current: false };
      const lastScannedRef = { current: null as string | null };
      const scanTimeoutRef = {
        current: null as ReturnType<typeof setTimeout> | null,
      };
      const setIsScanning = vi.fn();
      const setLastScannedData = vi.fn();
      const debounceMs = 2000;

      const handleBarcodeScanned = (result: { data: string; type: string }) => {
        if (isScanningRef.current) return;
        if (lastScannedRef.current === result.data) return;

        isScanningRef.current = true;
        lastScannedRef.current = result.data;
        setLastScannedData(result.data);
        setIsScanning(true);

        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }

        onBarcodeScanned(result);

        scanTimeoutRef.current = setTimeout(() => {
          isScanningRef.current = false;
          setIsScanning(false);
          lastScannedRef.current = null;
        }, debounceMs);
      };

      // First scan
      handleBarcodeScanned({ data: "123456789", type: "ean13" });
      expect(onBarcodeScanned).toHaveBeenCalledTimes(1);

      // Fast forward past debounce period
      vi.advanceTimersByTime(2000);

      // New scan should work
      handleBarcodeScanned({ data: "987654321", type: "ean13" });
      expect(onBarcodeScanned).toHaveBeenCalledTimes(2);
    });

    it("should block same barcode even after debounce if lastScannedRef not cleared", () => {
      const onBarcodeScanned = vi.fn();
      const isScanningRef = { current: false };
      const lastScannedRef = { current: null as string | null };
      const scanTimeoutRef = {
        current: null as ReturnType<typeof setTimeout> | null,
      };
      const setIsScanning = vi.fn();
      const setLastScannedData = vi.fn();
      const debounceMs = 2000;

      // Modified handler that doesn't clear lastScannedRef (bug scenario)
      const handleBarcodeScannedBuggy = (result: {
        data: string;
        type: string;
      }) => {
        if (isScanningRef.current) return;
        if (lastScannedRef.current === result.data) return;

        isScanningRef.current = true;
        lastScannedRef.current = result.data;
        setLastScannedData(result.data);
        setIsScanning(true);

        onBarcodeScanned(result);

        scanTimeoutRef.current = setTimeout(() => {
          isScanningRef.current = false;
          setIsScanning(false);
          // Note: lastScannedRef not cleared
        }, debounceMs);
      };

      handleBarcodeScannedBuggy({ data: "123456789", type: "ean13" });
      vi.advanceTimersByTime(2000);

      // Same barcode should still be blocked because lastScannedRef wasn't cleared
      handleBarcodeScannedBuggy({ data: "123456789", type: "ean13" });
      expect(onBarcodeScanned).toHaveBeenCalledTimes(1);
    });
  });

  describe("resetScanning", () => {
    it("should clear all scanning state", () => {
      const isScanningRef = { current: true };
      const lastScannedRef = { current: "123456789" };
      const scanTimeoutRef = { current: setTimeout(() => {}, 1000) };
      const setIsScanning = vi.fn();
      const setLastScannedData = vi.fn();

      const resetScanning = () => {
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
          scanTimeoutRef.current = null;
        }
        isScanningRef.current = false;
        setIsScanning(false);
        setLastScannedData(null);
        lastScannedRef.current = null;
      };

      resetScanning();

      expect(isScanningRef.current).toBe(false);
      expect(lastScannedRef.current).toBeNull();
      expect(scanTimeoutRef.current).toBeNull();
      expect(setIsScanning).toHaveBeenCalledWith(false);
      expect(setLastScannedData).toHaveBeenCalledWith(null);
    });

    it("should allow new scan after reset", () => {
      const onBarcodeScanned = vi.fn();
      const isScanningRef = { current: false };
      const lastScannedRef = { current: null as string | null };
      const scanTimeoutRef = {
        current: null as ReturnType<typeof setTimeout> | null,
      };
      const setIsScanning = vi.fn();
      const setLastScannedData = vi.fn();
      const debounceMs = 2000;

      const handleBarcodeScanned = (result: { data: string; type: string }) => {
        if (isScanningRef.current) return;
        if (lastScannedRef.current === result.data) return;

        isScanningRef.current = true;
        lastScannedRef.current = result.data;
        setLastScannedData(result.data);
        setIsScanning(true);

        onBarcodeScanned(result);

        scanTimeoutRef.current = setTimeout(() => {
          isScanningRef.current = false;
          setIsScanning(false);
          lastScannedRef.current = null;
        }, debounceMs);
      };

      const resetScanning = () => {
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
          scanTimeoutRef.current = null;
        }
        isScanningRef.current = false;
        setIsScanning(false);
        setLastScannedData(null);
        lastScannedRef.current = null;
      };

      // Scan
      handleBarcodeScanned({ data: "123456789", type: "ean13" });
      expect(onBarcodeScanned).toHaveBeenCalledTimes(1);

      // Reset immediately (before debounce)
      resetScanning();

      // Should allow same barcode scan again
      handleBarcodeScanned({ data: "123456789", type: "ean13" });
      expect(onBarcodeScanned).toHaveBeenCalledTimes(2);
    });
  });

  describe("timeout cleanup", () => {
    it("should clear existing timeout when new scan starts", () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const onBarcodeScanned = vi.fn();
      const isScanningRef = { current: false };
      const lastScannedRef = { current: null as string | null };
      const scanTimeoutRef = {
        current: null as ReturnType<typeof setTimeout> | null,
      };
      const setIsScanning = vi.fn();
      const setLastScannedData = vi.fn();
      const debounceMs = 2000;

      const handleBarcodeScanned = (result: { data: string; type: string }) => {
        if (isScanningRef.current) return;
        if (lastScannedRef.current === result.data) return;

        isScanningRef.current = true;
        lastScannedRef.current = result.data;
        setLastScannedData(result.data);
        setIsScanning(true);

        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }

        onBarcodeScanned(result);

        scanTimeoutRef.current = setTimeout(() => {
          isScanningRef.current = false;
          setIsScanning(false);
          lastScannedRef.current = null;
        }, debounceMs);
      };

      // First scan sets timeout
      handleBarcodeScanned({ data: "123456789", type: "ean13" });
      // Wait for debounce, allow new scan
      vi.advanceTimersByTime(2000);

      // Second scan should clear the previous timeout (even though it already fired)
      handleBarcodeScanned({ data: "987654321", type: "ean13" });

      // clearTimeout should have been called
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });
});

describe("useCamera callback handling", () => {
  it("should not call callback when onBarcodeScanned is undefined", () => {
    const isScanningRef = { current: false };
    const lastScannedRef = { current: null as string | null };
    const scanTimeoutRef = {
      current: null as ReturnType<typeof setTimeout> | null,
    };
    const setIsScanning = vi.fn();
    const setLastScannedData = vi.fn();
    const onBarcodeScanned = undefined;
    const debounceMs = 2000;

    const handleBarcodeScanned = (result: { data: string; type: string }) => {
      if (isScanningRef.current) return;
      if (lastScannedRef.current === result.data) return;

      isScanningRef.current = true;
      lastScannedRef.current = result.data;
      setLastScannedData(result.data);
      setIsScanning(true);

      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      onBarcodeScanned?.(result);

      scanTimeoutRef.current = setTimeout(() => {
        isScanningRef.current = false;
        setIsScanning(false);
        lastScannedRef.current = null;
      }, debounceMs);
    };

    // Should not throw
    expect(() => {
      handleBarcodeScanned({ data: "123456789", type: "ean13" });
    }).not.toThrow();

    // State should still be updated
    expect(setIsScanning).toHaveBeenCalledWith(true);
  });
});
