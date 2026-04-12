// @vitest-environment jsdom
import React from "react";
import { Text } from "react-native";
import { screen } from "@testing-library/react";
import { renderComponent } from "../../../test/utils/render-component";
import { AnimatedQueryContent } from "../AnimatedQueryContent";

describe("AnimatedQueryContent", () => {
  it("renders children when isLoading is false", () => {
    renderComponent(
      <AnimatedQueryContent isLoading={false}>
        <Text>Content loaded</Text>
      </AnimatedQueryContent>,
    );
    expect(screen.getByText("Content loaded")).toBeDefined();
  });

  it("renders nothing when isLoading is true", () => {
    renderComponent(
      <AnimatedQueryContent isLoading={true}>
        <Text>Content loaded</Text>
      </AnimatedQueryContent>,
    );
    expect(screen.queryByText("Content loaded")).toBeNull();
  });
});
