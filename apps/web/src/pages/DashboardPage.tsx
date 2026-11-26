import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Clock, Package, TrendingUp, TriangleAlert } from "lucide-react";
import { useAnalytics } from "../hooks/useApi";
import { StatCard } from "../components/StatCard";
import { ErrorState, LoadingState } from "../components/States";
import { StatusBadge } from "../components/StatusBadge";

const STATUS_COLORS: Record<string, string> = {
  pending: "#94a3b8",
  in_transit: "#3b82f6",
  out_for_delivery: "#6366f1",
  delivered: "#22c55e",
  delayed: "#ef4444",
  cancelled: "#d1d5db",
};

export function DashboardPage() {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) return <LoadingState label="Loading analytics…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <ErrorState message="No analytics available" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">Operational overview from live backend data.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total deliveries" value={data.totalDeliveries} icon={Package} />
        <StatCard label="In transit" value={data.inTransit} icon={Clock} tone="info" />
        <StatCard label="Completed" value={data.completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Delayed" value={data.delayed} icon={TriangleAlert} tone="danger" />
        <StatCard
          label="Success rate"
          value={`${(data.successRate * 100).toFixed(1)}%`}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Status distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.statusDistribution}
                dataKey="count"
                nameKey="status"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.statusDistribution.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#cbd5e1"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Performance over time</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.performanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} name="Total" />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#22c55e"
                strokeWidth={2}
                name="Delivered"
              />
              <Line
                type="monotone"
                dataKey="delayed"
                stroke="#ef4444"
                strokeWidth={2}
                name="Delayed"
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Carrier performance (worst first)
          </h2>
          <ul className="divide-y divide-slate-100">
            {data.carrierPerformance.slice(0, 5).map((c) => (
              <li key={c.carrier} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-slate-700">{c.carrier}</span>
                <span className="text-slate-500">
                  {(c.onTimeRate * 100).toFixed(0)}% on-time · {c.delayed} delayed
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Recent activity</h2>
          <ul className="space-y-3">
            {data.recentActivity.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-700">{a.deliveryId}</p>
                  <p className="text-xs text-slate-400">
                    {a.location} · {new Date(a.occurredAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
