import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { Analytics } from "@smart-logistics/shared";
import { DashboardPage } from "./DashboardPage";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(
      async () =>
        ({
          totalDeliveries: 16,
          inTransit: 4,
          completed: 5,
          delayed: 5,
          successRate: 0.3125,
          statusDistribution: [{ status: "delivered", count: 5 }],
          performanceOverTime: [{ date: "2026-11-01", total: 16, delivered: 5, delayed: 5 }],
          carrierPerformance: [
            { carrier: "X", total: 16, delivered: 5, delayed: 5, onTimeRate: 0.69 },
          ],
          regionPerformance: [{ region: "EU-West", total: 16, delayed: 5, delayRate: 0.31 }],
          recentActivity: [],
        }) satisfies Analytics,
    ),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardPage", () => {
  it("renders metrics from the API", async () => {
    renderPage();
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("16")).toBeInTheDocument());
    expect(screen.getByText("31.3%")).toBeInTheDocument();
  });
});
