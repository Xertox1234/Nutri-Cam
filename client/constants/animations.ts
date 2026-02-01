import { WithSpringConfig } from "react-native-reanimated";

/**
 * Shared animation configurations for consistent UI interactions.
 */

/** Spring configuration for press feedback animations */
export const pressSpringConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};
