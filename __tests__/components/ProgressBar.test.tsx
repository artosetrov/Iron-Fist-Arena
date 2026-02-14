// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProgressBar from "@/app/components/ui/ProgressBar";

describe("ProgressBar", () => {
  it("renders with correct ARIA attributes", () => {
    render(<ProgressBar value={50} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps value to 0-100 range", () => {
    const { rerender } = render(<ProgressBar value={-10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    rerender(<ProgressBar value={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("renders label when provided", () => {
    render(<ProgressBar value={75} label="75%" />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("does not render label when not provided", () => {
    const { container } = render(<ProgressBar value={50} />);
    const label = container.querySelector("span");
    expect(label).toBeNull();
  });

  it("renders with all variants without crashing", () => {
    const variants = [
      "primary",
      "success",
      "danger",
      "warning",
      "info",
      "xp",
      "stamina",
    ] as const;
    for (const variant of variants) {
      const { unmount } = render(<ProgressBar value={50} variant={variant} />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      unmount();
    }
  });

  it("sets correct width style on fill element", () => {
    const { container } = render(<ProgressBar value={60} />);
    const fill = container.querySelector("[style]") as HTMLElement;
    expect(fill?.style.width).toBe("60%");
  });
});
