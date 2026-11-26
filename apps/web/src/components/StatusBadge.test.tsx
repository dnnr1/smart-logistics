import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders a human label for a status", () => {
    render(<StatusBadge status="in_transit" />);
    expect(screen.getByText("In transit")).toBeInTheDocument();
  });

  it("renders the delayed label", () => {
    render(<StatusBadge status="delayed" />);
    expect(screen.getByText("Delayed")).toBeInTheDocument();
  });
});
