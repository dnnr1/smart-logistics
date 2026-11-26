import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Package } from "lucide-react";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="Total deliveries" value={42} icon={Package} />);
    expect(screen.getByText("Total deliveries")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
