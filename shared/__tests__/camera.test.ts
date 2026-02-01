import {
  expoBarcodeTypes,
  visionCameraBarcodeTypes,
  BARCODE_TYPE_MAP,
  BARCODE_TYPE_REVERSE_MAP,
  ALL_BARCODE_TYPES,
} from "../types/camera";

describe("Camera Types", () => {
  describe("expoBarcodeTypes", () => {
    it("should include all expected barcode types", () => {
      expect(expoBarcodeTypes).toContain("ean13");
      expect(expoBarcodeTypes).toContain("ean8");
      expect(expoBarcodeTypes).toContain("upc_a");
      expect(expoBarcodeTypes).toContain("upc_e");
      expect(expoBarcodeTypes).toContain("code128");
      expect(expoBarcodeTypes).toContain("code39");
      expect(expoBarcodeTypes).toContain("code93");
      expect(expoBarcodeTypes).toContain("datamatrix");
      expect(expoBarcodeTypes).toContain("qr");
    });
  });

  describe("visionCameraBarcodeTypes", () => {
    it("should include all expected barcode types", () => {
      expect(visionCameraBarcodeTypes).toContain("ean-13");
      expect(visionCameraBarcodeTypes).toContain("ean-8");
      expect(visionCameraBarcodeTypes).toContain("upc-a");
      expect(visionCameraBarcodeTypes).toContain("upc-e");
      expect(visionCameraBarcodeTypes).toContain("code-128");
      expect(visionCameraBarcodeTypes).toContain("code-39");
      expect(visionCameraBarcodeTypes).toContain("code-93");
      expect(visionCameraBarcodeTypes).toContain("data-matrix");
      expect(visionCameraBarcodeTypes).toContain("qr");
    });
  });

  describe("BARCODE_TYPE_MAP", () => {
    it("should map all expo types to vision camera types", () => {
      expoBarcodeTypes.forEach((expoType) => {
        expect(BARCODE_TYPE_MAP[expoType]).toBeDefined();
      });
    });

    it("should correctly map specific types", () => {
      expect(BARCODE_TYPE_MAP.ean13).toBe("ean-13");
      expect(BARCODE_TYPE_MAP.upc_a).toBe("upc-a");
      expect(BARCODE_TYPE_MAP.datamatrix).toBe("data-matrix");
      expect(BARCODE_TYPE_MAP.qr).toBe("qr");
    });
  });

  describe("BARCODE_TYPE_REVERSE_MAP", () => {
    it("should map all vision camera types back to expo types", () => {
      visionCameraBarcodeTypes.forEach((visionType) => {
        expect(BARCODE_TYPE_REVERSE_MAP[visionType]).toBeDefined();
      });
    });

    it("should be the inverse of BARCODE_TYPE_MAP", () => {
      expoBarcodeTypes.forEach((expoType) => {
        const visionType = BARCODE_TYPE_MAP[expoType];
        expect(BARCODE_TYPE_REVERSE_MAP[visionType]).toBe(expoType);
      });
    });
  });

  describe("ALL_BARCODE_TYPES", () => {
    it("should include all barcode types (no tier restrictions)", () => {
      expect(ALL_BARCODE_TYPES).toContain("ean13");
      expect(ALL_BARCODE_TYPES).toContain("ean8");
      expect(ALL_BARCODE_TYPES).toContain("upc_a");
      expect(ALL_BARCODE_TYPES).toContain("upc_e");
      expect(ALL_BARCODE_TYPES).toContain("code128");
      expect(ALL_BARCODE_TYPES).toContain("code39");
      expect(ALL_BARCODE_TYPES).toContain("code93");
      expect(ALL_BARCODE_TYPES).toContain("datamatrix");
      expect(ALL_BARCODE_TYPES).toContain("qr");
    });

    it("should equal expoBarcodeTypes", () => {
      expect(ALL_BARCODE_TYPES).toEqual([...expoBarcodeTypes]);
    });
  });
});
