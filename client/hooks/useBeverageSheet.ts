import React, { useCallback, useMemo, useRef, useState } from "react";

import { BeveragePickerSheet } from "@/components/BeveragePickerSheet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

export interface BeverageSheetOptions {
  mealType: string | null;
  onLogged?: (beverageName: string, size: string) => void;
}

const defaults: BeverageSheetOptions = { mealType: null };

/**
 * Hook-returned component pattern for the beverage picker bottom sheet.
 *
 * Returns `{ open, BeverageSheet }`. Render `<BeverageSheet />` once at
 * the bottom of your JSX (inside the accessibilityViewIsModal container).
 * Call `open({ mealType })` to present the sheet.
 */
export function useBeverageSheet() {
  const optionsRef = useRef<BeverageSheetOptions>(defaults);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [revision, setRevision] = useState(0);

  const open = useCallback((options: BeverageSheetOptions) => {
    optionsRef.current = options;
    setRevision((r) => r + 1);
    sheetRef.current?.present();
  }, []);

  // Stable component identity — useMemo (not useCallback) to avoid remounts
  const BeverageSheet = useMemo(
    () =>
      function StableBeverageSheet() {
        return React.createElement(BeveragePickerSheet, {
          sheetRef,
          optionsRef,
          revision,
        });
      },
    [revision],
  );

  return { open, BeverageSheet };
}
