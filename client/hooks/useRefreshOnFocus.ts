import { useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Calls `refetch` each time the screen gains focus,
 * skipping the initial mount (data is already fresh from useQuery).
 */
export function useRefreshOnFocus(refetch: () => void) {
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
