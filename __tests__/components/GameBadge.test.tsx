// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GameBadge from "@/app/components/ui/GameBadge";

describe("GameBadge", () => {
  it("renders children text", () => {
    render(<GameBadge>Epic</GameBadge>);
    expect(screen.getByText("Epic")).toBeInTheDocument();
  });

  it("renders as pill shape when pill prop is true", () => {
    const { container } = render(<GameBadge pill>Pill</GameBadge>);
    expect(container.firstChild).toHaveClass("rounded-full");
  });

  it("renders as rounded-md by default", () => {
    const { container } = render(<GameBadge>Default</GameBadge>);
    expect(container.firstChild).toHaveClass("rounded-md");
  });

  it("renders with all variants without crashing", () => {
    const variants = [
      "default",
      "success",
      "warning",
      "danger",
      "info",
      "premium",
    ] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <GameBadge variant={variant}>{variant}</GameBadge>,
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    }
  });

  it("applies uppercase styling", () => {
    const { container } = render(<GameBadge>test</GameBadge>);
    expect(container.firstChild).toHaveClass("uppercase");
  });
});
