import { useRef, useCallback, useEffect } from "react";
import {
  useTextRecognition,
  type Text as OCRText,
} from "react-native-vision-camera-ocr-plus";
import { useFrameProcessor } from "react-native-vision-camera";
import { useRunOnJS } from "react-native-worklets-core";
import * as Haptics from "expo-haptics";

export interface UseOCRDetectionOptions {
  /** Whether OCR detection is active */
  enabled: boolean;
  /** Called when text detection state changes */
  onTextDetected?: (detected: boolean) => void;
  /** Called with raw OCR result after each processed frame */
  onOCRResult?: (text: OCRText) => void;
  /** Debounce ms before firing textDetected(false). Default: 500 */
  debounceMs?: number;
}

export interface UseOCRDetectionReturn {
  /** Frame processor to pass to <Camera frameProcessor={...}> */
  frameProcessor: ReturnType<typeof useFrameProcessor> | undefined;
  /** Most recent OCR result (cached for passing to LabelAnalysisScreen on capture) */
  latestOCRResult: React.RefObject<OCRText | null>;
}

export function useOCRDetection(
  options: UseOCRDetectionOptions,
): UseOCRDetectionReturn {
  const { enabled, onTextDetected, onOCRResult, debounceMs = 500 } = options;

  const latestOCRResult = useRef<OCRText | null>(null);
  const isTextDetectedRef = useRef(false);
  const hasHapticsRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset haptic flag when disabled (new capture session)
  useEffect(() => {
    if (!enabled) {
      hasHapticsRef.current = false;
      isTextDetectedRef.current = false;
      latestOCRResult.current = null;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [enabled]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const { scanText } = useTextRecognition({
    language: "latin",
    frameSkipThreshold: 10,
  });

  // JS-thread callback for OCR results from the worklet
  const handleOCRResult = useCallback(
    (result: OCRText) => {
      const hasText = result.resultText.trim().length > 0;

      latestOCRResult.current = hasText ? result : null;

      if (hasText) {
        onOCRResult?.(result);
      }

      if (hasText && !isTextDetectedRef.current) {
        // Transition: no text → text detected
        isTextDetectedRef.current = true;

        // Clear any pending "no text" debounce
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        onTextDetected?.(true);

        // Fire haptic once per session
        if (!hasHapticsRef.current) {
          hasHapticsRef.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else if (!hasText && isTextDetectedRef.current) {
        // Transition: text detected → no text (debounced)
        if (!debounceTimerRef.current) {
          debounceTimerRef.current = setTimeout(() => {
            isTextDetectedRef.current = false;
            debounceTimerRef.current = null;
            onTextDetected?.(false);
          }, debounceMs);
        }
      }
    },
    [onTextDetected, onOCRResult, debounceMs],
  );

  // Bridge from worklet to JS thread
  const runOnJS = useRunOnJS(handleOCRResult, [handleOCRResult]);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const result = scanText(frame);
      runOnJS(result);
    },
    [scanText, runOnJS],
  );

  return {
    frameProcessor: enabled ? frameProcessor : undefined,
    latestOCRResult,
  };
}
