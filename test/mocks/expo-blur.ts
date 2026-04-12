// Mock expo-blur for tests. Prevents unparseable JSX in compiled expo-blur output.
import React from "react";

export function BlurView(props: Record<string, unknown>) {
  return React.createElement("View", props);
}
