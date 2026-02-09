import { useState, useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import type { PurchaseState } from "@shared/types/subscription";
import { canInitiatePurchase } from "@/lib/subscription/type-guards";
import { usePremiumContext } from "@/context/PremiumContext";
import { apiRequest } from "@/lib/query-client";
import { useIAP, PRODUCT_IDS } from "./index";
import {
  mapIAPError,
  buildReceiptPayload,
  buildRestorePayload,
  isSupportedPlatform,
} from "./purchase-utils";

export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({ status: "idle" });
  const { refreshSubscription } = usePremiumContext();
  const iap = useIAP();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((newState: PurchaseState) => {
    if (mountedRef.current) {
      setState(newState);
    }
  }, []);

  const purchase = useCallback(async () => {
    if (!canInitiatePurchase(state)) return;

    const platform = Platform.OS;
    if (!isSupportedPlatform(platform)) {
      safeSetState({
        status: "error",
        error: {
          code: "STORE_UNAVAILABLE",
          message: "In-app purchases are not supported on this platform",
        },
      });
      return;
    }

    safeSetState({ status: "loading" });

    try {
      const result = await iap.requestPurchase(PRODUCT_IDS.ANNUAL_PREMIUM);
      safeSetState({ status: "pending" });

      await apiRequest(
        "POST",
        "/api/subscription/upgrade",
        buildReceiptPayload(result, platform),
      );

      await iap.finishTransaction(result);
      await refreshSubscription();
      safeSetState({ status: "success" });
    } catch (error) {
      const purchaseError = mapIAPError(error);
      if (purchaseError.code === "USER_CANCELLED") {
        safeSetState({ status: "cancelled" });
      } else {
        safeSetState({ status: "error", error: purchaseError });
      }
    }
  }, [state, safeSetState, iap, refreshSubscription]);

  const restore = useCallback(async () => {
    if (!canInitiatePurchase(state)) return;

    const platform = Platform.OS;
    if (!isSupportedPlatform(platform)) {
      safeSetState({
        status: "error",
        error: {
          code: "STORE_UNAVAILABLE",
          message: "In-app purchases are not supported on this platform",
        },
      });
      return;
    }

    safeSetState({ status: "restoring" });

    try {
      const result = await iap.restorePurchases();

      await apiRequest(
        "POST",
        "/api/subscription/restore",
        buildRestorePayload(result.transactionReceipt, platform),
      );

      await iap.finishTransaction(result);
      await refreshSubscription();
      safeSetState({ status: "success" });
    } catch (error) {
      const purchaseError = mapIAPError(error);
      if (purchaseError.code === "USER_CANCELLED") {
        safeSetState({ status: "cancelled" });
      } else {
        safeSetState({ status: "error", error: purchaseError });
      }
    }
  }, [state, safeSetState, iap, refreshSubscription]);

  const reset = useCallback(() => {
    safeSetState({ status: "idle" });
  }, [safeSetState]);

  return { state, purchase, restore, reset };
}
