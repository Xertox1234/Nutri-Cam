// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuickLogSession, MAX_LOG_ITEMS } from "../useQuickLogSession";
import { createQueryWrapper } from "../../../test/utils/query-wrapper";
import type { ParsedFoodItem } from "../useQuickLogSession";

const { mockApiRequest, mockTokenStorage } = vi.hoisted(() => ({
  mockApiRequest: vi.fn(),
  mockTokenStorage: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    invalidateCache: vi.fn(),
  },
}));

vi.mock("@/lib/query-client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  getApiUrl: () => "http://localhost:3000",
}));

vi.mock("@/lib/token-storage", () => ({ tokenStorage: mockTokenStorage }));

const mockSpeechToText = {
  isListening: false,
  transcript: "",
  isFinal: false,
  volume: -2,
  error: null,
  startListening: vi.fn(),
  stopListening: vi.fn(),
};

vi.mock("@/hooks/useSpeechToText", () => ({
  useSpeechToText: vi.fn(() => mockSpeechToText),
}));

vi.mock("@/hooks/useHaptics", () => ({
  useHaptics: () => ({ impact: vi.fn(), notification: vi.fn() }),
}));

beforeEach(async () => {
  vi.clearAllMocks();
  // Reset useSpeechToText factory to default values between tests
  const { useSpeechToText } = await import("@/hooks/useSpeechToText");
  (useSpeechToText as ReturnType<typeof vi.fn>).mockReturnValue(
    mockSpeechToText,
  );
  mockTokenStorage.get.mockResolvedValue("test-token");
  // Consume the frequent-items useQuery that fires on mount so it does not
  // interfere with the mock responses queued by individual tests.
  mockApiRequest.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ items: [] }),
  });
});

describe("useQuickLogSession", () => {
  it("parses food text and populates parsedItems on success", async () => {
    const { wrapper } = createQueryWrapper();
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              name: "eggs",
              quantity: 2,
              unit: "large",
              calories: 143,
              protein: 12,
              carbs: 1,
              fat: 10,
              servingSize: null,
            },
          ],
        }),
    });

    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    act(() => result.current.setInputText("2 eggs"));
    act(() => result.current.handleTextSubmit());

    await waitFor(() => expect(result.current.parsedItems).toHaveLength(1));
    expect(result.current.parsedItems[0].name).toBe("eggs");
    expect(result.current.parseError).toBeNull();
  });

  it("sets parseError when parse fails", async () => {
    const { wrapper } = createQueryWrapper();
    mockApiRequest.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    act(() => result.current.setInputText("some food"));
    act(() => result.current.handleTextSubmit());

    await waitFor(() => expect(result.current.parseError).not.toBeNull());
    expect(result.current.parsedItems).toHaveLength(0);
  });

  it("removes item by index", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              name: "eggs",
              quantity: 2,
              unit: "large",
              calories: 143,
              protein: 12,
              carbs: 1,
              fat: 10,
              servingSize: null,
            },
            {
              name: "coffee",
              quantity: 1,
              unit: "cup",
              calories: 5,
              protein: 0,
              carbs: 1,
              fat: 0,
              servingSize: null,
            },
          ],
        }),
    });

    act(() => result.current.setInputText("2 eggs and coffee"));
    act(() => result.current.handleTextSubmit());

    await waitFor(() => expect(result.current.parsedItems).toHaveLength(2));

    act(() => result.current.removeItem(0));

    expect(result.current.parsedItems).toHaveLength(1);
    expect(result.current.parsedItems[0].name).toBe("coffee");
  });

  it("calls onLogSuccess with summary after submitLog succeeds", async () => {
    const { wrapper } = createQueryWrapper();
    const onLogSuccess = vi.fn();

    mockApiRequest
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                name: "chicken",
                quantity: 1,
                unit: "breast",
                calories: 320,
                protein: 58,
                carbs: 0,
                fat: 7,
                servingSize: null,
              },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

    const { result } = renderHook(() => useQuickLogSession({ onLogSuccess }), {
      wrapper,
    });

    act(() => result.current.setInputText("chicken breast"));
    act(() => result.current.handleTextSubmit());

    await waitFor(() => expect(result.current.parsedItems).toHaveLength(1));

    act(() => result.current.submitLog());

    await waitFor(() => expect(onLogSuccess).toHaveBeenCalledOnce());
    expect(onLogSuccess).toHaveBeenCalledWith({
      itemCount: 1,
      totalCalories: 320,
      firstName: "chicken",
    });
    expect(result.current.parsedItems).toHaveLength(0);
    expect(result.current.inputText).toBe("");
  });

  it("sets submitError when log fails", async () => {
    const { wrapper } = createQueryWrapper();
    mockApiRequest
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                name: "eggs",
                quantity: 1,
                unit: "large",
                calories: 72,
                protein: 6,
                carbs: 0,
                fat: 5,
                servingSize: null,
              },
            ],
          }),
      })
      .mockRejectedValueOnce(new Error("server error"));

    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    act(() => result.current.setInputText("egg"));
    act(() => result.current.handleTextSubmit());
    await waitFor(() => expect(result.current.parsedItems).toHaveLength(1));

    act(() => result.current.submitLog());

    await waitFor(() => expect(result.current.submitError).not.toBeNull());
  });

  it("reset clears inputText, parsedItems, and errors", async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    act(() => result.current.setInputText("some food"));

    act(() => result.current.reset());

    expect(result.current.inputText).toBe("");
    expect(result.current.parsedItems).toHaveLength(0);
    expect(result.current.parseError).toBeNull();
    expect(result.current.submitError).toBeNull();
  });

  it("auto-parses when isFinal becomes true with a transcript", async () => {
    const { useSpeechToText } = await import("@/hooks/useSpeechToText");
    (useSpeechToText as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockSpeechToText,
      isFinal: true,
      transcript: "3 eggs",
    });

    const { wrapper } = createQueryWrapper();
    // frequentItems pre-queued in beforeEach; parse mock next
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              name: "eggs",
              quantity: 3,
              unit: "large",
              calories: 216,
              protein: 18,
              carbs: 1,
              fat: 15,
              servingSize: null,
            },
          ],
        }),
    });

    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    await waitFor(() => expect(result.current.parsedItems).toHaveLength(1));
    expect(result.current.parsedItems[0].name).toBe("eggs");
  });

  it("handleVoicePress calls startListening when not listening", () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    act(() => result.current.handleVoicePress());

    expect(mockSpeechToText.startListening).toHaveBeenCalledOnce();
  });

  it("caps items at MAX_LOG_ITEMS and sets capWarning when items exceed the limit", async () => {
    const { wrapper } = createQueryWrapper();

    // Build MAX_LOG_ITEMS + 2 items
    const manyItems: ParsedFoodItem[] = Array.from(
      { length: MAX_LOG_ITEMS + 2 },
      (_, i) => ({
        name: `food${i}`,
        quantity: 1,
        unit: "serving",
        calories: 100,
        protein: null,
        carbs: null,
        fat: null,
        servingSize: null,
      }),
    );

    // Mock parse response
    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: manyItems }),
    });
    // Mock log responses for only the capped items
    for (let i = 0; i < MAX_LOG_ITEMS; i++) {
      mockApiRequest.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: i }),
      });
    }

    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    act(() => result.current.setInputText("many foods"));
    act(() => result.current.handleTextSubmit());

    await waitFor(() =>
      expect(result.current.parsedItems).toHaveLength(MAX_LOG_ITEMS + 2),
    );

    act(() => result.current.submitLog());

    await waitFor(() => expect(result.current.capWarning).not.toBeNull());
    expect(result.current.capWarning).toContain(`${MAX_LOG_ITEMS}`);
    // Only MAX_LOG_ITEMS POST requests were made (not MAX_LOG_ITEMS + 2)
    const logCalls = mockApiRequest.mock.calls.filter(
      (args) =>
        args[0] === "POST" &&
        (args[1] as string).includes("/api/scanned-items"),
    );
    expect(logCalls).toHaveLength(MAX_LOG_ITEMS);
  });

  it("does not set capWarning when items are within the limit", async () => {
    const { wrapper } = createQueryWrapper();

    const items: ParsedFoodItem[] = Array.from(
      { length: MAX_LOG_ITEMS },
      (_, i) => ({
        name: `food${i}`,
        quantity: 1,
        unit: "serving",
        calories: 50,
        protein: null,
        carbs: null,
        fat: null,
        servingSize: null,
      }),
    );

    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items }),
    });
    for (let i = 0; i < MAX_LOG_ITEMS; i++) {
      mockApiRequest.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: i }),
      });
    }

    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    act(() => result.current.setInputText("ten foods"));
    act(() => result.current.handleTextSubmit());

    await waitFor(() =>
      expect(result.current.parsedItems).toHaveLength(MAX_LOG_ITEMS),
    );

    act(() => result.current.submitLog());

    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    expect(result.current.capWarning).toBeNull();
  });

  it("reset clears capWarning", async () => {
    const { wrapper } = createQueryWrapper();

    const manyItems: ParsedFoodItem[] = Array.from(
      { length: MAX_LOG_ITEMS + 1 },
      (_, i) => ({
        name: `food${i}`,
        quantity: 1,
        unit: "serving",
        calories: 100,
        protein: null,
        carbs: null,
        fat: null,
        servingSize: null,
      }),
    );

    mockApiRequest.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: manyItems }),
    });
    for (let i = 0; i < MAX_LOG_ITEMS; i++) {
      mockApiRequest.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: i }),
      });
    }

    const { result } = renderHook(() => useQuickLogSession(), { wrapper });

    act(() => result.current.setInputText("many foods"));
    act(() => result.current.handleTextSubmit());

    await waitFor(() =>
      expect(result.current.parsedItems).toHaveLength(MAX_LOG_ITEMS + 1),
    );

    act(() => result.current.submitLog());

    await waitFor(() => expect(result.current.capWarning).not.toBeNull());

    act(() => result.current.reset());

    expect(result.current.capWarning).toBeNull();
  });
});
