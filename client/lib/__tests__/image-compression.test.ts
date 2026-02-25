import { compressImage, cleanupImage } from "../image-compression";

const { mockManipulateAsync, mockGetInfoAsync, mockDeleteAsync } = vi.hoisted(
  () => ({
    mockManipulateAsync: vi.fn(),
    mockGetInfoAsync: vi.fn(),
    mockDeleteAsync: vi.fn(),
  }),
);

vi.mock("expo-image-manipulator", () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
  SaveFormat: { JPEG: "jpeg" },
}));

vi.mock("expo-file-system/legacy", () => ({
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
}));

describe("compressImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resizes and compresses with default options", async () => {
    mockManipulateAsync.mockResolvedValue({
      uri: "file://compressed.jpg",
      width: 1024,
      height: 768,
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 500 * 1024 }); // 500KB

    const result = await compressImage("file://original.jpg");

    expect(mockManipulateAsync).toHaveBeenCalledWith(
      "file://original.jpg",
      [{ resize: { width: 1024, height: 1024 } }],
      { compress: 0.7, format: "jpeg" },
    );
    expect(result).toEqual({
      uri: "file://compressed.jpg",
      width: 1024,
      height: 768,
      sizeKB: 500,
    });
  });

  it("applies custom options", async () => {
    mockManipulateAsync.mockResolvedValue({
      uri: "file://small.jpg",
      width: 512,
      height: 512,
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 200 * 1024 });

    await compressImage("file://orig.jpg", {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.5,
    });

    expect(mockManipulateAsync).toHaveBeenCalledWith(
      "file://orig.jpg",
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.5, format: "jpeg" },
    );
  });

  it("does adaptive quality reduction when image exceeds target size", async () => {
    // First pass: too large (1200KB > 900KB target)
    mockManipulateAsync
      .mockResolvedValueOnce({
        uri: "file://pass1.jpg",
        width: 1024,
        height: 768,
      })
      .mockResolvedValueOnce({
        uri: "file://pass2.jpg",
        width: 1024,
        height: 768,
      });
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true, size: 1200 * 1024 })
      .mockResolvedValueOnce({ exists: true, size: 800 * 1024 });

    const result = await compressImage("file://large.jpg");

    // Should be called twice (initial + adaptive)
    expect(mockManipulateAsync).toHaveBeenCalledTimes(2);
    // Second call should have reduced quality: 0.7 * (900/1200) = 0.525
    const secondCall = mockManipulateAsync.mock.calls[1];
    expect(secondCall[2].compress).toBeCloseTo(0.525, 2);
    expect(result.uri).toBe("file://pass2.jpg");
    expect(result.sizeKB).toBe(800);
  });

  it("clamps adaptive quality to minimum 0.3", async () => {
    // Very large file that would push quality below 0.3
    mockManipulateAsync
      .mockResolvedValueOnce({
        uri: "file://huge1.jpg",
        width: 1024,
        height: 768,
      })
      .mockResolvedValueOnce({
        uri: "file://huge2.jpg",
        width: 1024,
        height: 768,
      });
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true, size: 5000 * 1024 }) // 5MB
      .mockResolvedValueOnce({ exists: true, size: 1500 * 1024 });

    await compressImage("file://huge.jpg");

    const secondCall = mockManipulateAsync.mock.calls[1];
    // 0.7 * (900/5000) = 0.126, clamped to 0.3
    expect(secondCall[2].compress).toBe(0.3);
  });

  it("skips adaptive pass when quality is already at 0.3", async () => {
    mockManipulateAsync.mockResolvedValue({
      uri: "file://compressed.jpg",
      width: 1024,
      height: 768,
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1200 * 1024 });

    await compressImage("file://test.jpg", { quality: 0.3 });

    // Only one pass since quality <= 0.3
    expect(mockManipulateAsync).toHaveBeenCalledTimes(1);
  });

  it("handles non-existent file info gracefully", async () => {
    mockManipulateAsync.mockResolvedValue({
      uri: "file://result.jpg",
      width: 800,
      height: 600,
    });
    mockGetInfoAsync.mockResolvedValue({ exists: false });

    const result = await compressImage("file://missing.jpg");

    expect(result.sizeKB).toBe(0);
  });
});

describe("cleanupImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the image file with idempotent flag", async () => {
    mockDeleteAsync.mockResolvedValue(undefined);

    await cleanupImage("file://temp.jpg");

    expect(mockDeleteAsync).toHaveBeenCalledWith("file://temp.jpg", {
      idempotent: true,
    });
  });

  it("silently ignores delete errors", async () => {
    mockDeleteAsync.mockRejectedValue(new Error("Permission denied"));

    // Should not throw
    await expect(cleanupImage("file://locked.jpg")).resolves.toBeUndefined();
  });
});
