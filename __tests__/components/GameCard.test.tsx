// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GameCard from "@/app/components/ui/GameCard";

describe("GameCard", () => {
  it("renders children content", () => {
    render(<GameCard>Card content</GameCard>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { container } = render(<GameCard>Default</GameCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("rounded-2xl");
    expect(card).toHaveClass("border-2");
  });

  it("renders with thin border", () => {
    const { container } = render(<GameCard thin>Thin</GameCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("border");
  });

  it("renders with all variants without crashing", () => {
    const variants = [
      "default",
      "interactive",
      "selected",
      "success",
      "danger",
      "warning",
    ] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <GameCard variant={variant}>{variant}</GameCard>,
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    }
  });

  it("forwards ref to div element", () => {
    const ref = vi.fn();
    render(<GameCard ref={ref}>Ref</GameCard>);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });

  it("applies custom className", () => {
    const { container } = render(
      <GameCard className="custom-class">Custom</GameCard>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
