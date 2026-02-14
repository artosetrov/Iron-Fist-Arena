// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GameButton from "@/app/components/ui/GameButton";

describe("GameButton", () => {
  it("renders children text", () => {
    render(<GameButton>Click me</GameButton>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<GameButton onClick={handleClick}>Click</GameButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<GameButton disabled>Disabled</GameButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <GameButton disabled onClick={handleClick}>
        Disabled
      </GameButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies full width class when fullWidth is true", () => {
    render(<GameButton fullWidth>Full</GameButton>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("renders with different variants without crashing", () => {
    const variants = ["primary", "secondary", "danger", "ghost", "action"] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <GameButton variant={variant}>{variant}</GameButton>,
      );
      expect(screen.getByRole("button", { name: variant })).toBeInTheDocument();
      unmount();
    }
  });

  it("renders with different sizes without crashing", () => {
    const sizes = ["sm", "md", "lg"] as const;
    for (const size of sizes) {
      const { unmount } = render(
        <GameButton size={size}>{size}</GameButton>,
      );
      expect(screen.getByRole("button", { name: size })).toBeInTheDocument();
      unmount();
    }
  });

  it("forwards ref to button element", () => {
    const ref = vi.fn();
    render(<GameButton ref={ref}>Ref</GameButton>);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
  });
});
