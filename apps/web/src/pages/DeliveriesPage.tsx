import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import type { DeliveryInput, DeliveryStatus } from "@smart-logistics/shared";
import { deliveryStatusSchema } from "@smart-logistics/shared";
import { useCreateDelivery, useDeliveries } from "../hooks/useApi";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

const EMPTY_FORM: DeliveryInput = {
  trackingCode: "",
  origin: "",
  destination: "",
  carrier: "",
  region: "",
  distanceKm: 0,
  estimatedDeliveryAt: new Date().toISOString(),
};

export function DeliveriesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DeliveryInput>(EMPTY_FORM);

  const query = { page: 1, pageSize: 20, ...(status ? { status } : {}), ...(q ? { q } : {}) };
  const { data, isLoading, error } = useDeliveries(query);
  const create = useCreateDelivery();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      /* error surfaced via mutation state */
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deliveries</h1>
          <p className="text-sm text-slate-500">Search, filter and manage deliveries.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New delivery
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            required
            placeholder="Tracking code (e.g. SLX12345678)"
            value={form.trackingCode}
            onChange={(e) => setForm({ ...form, trackingCode: e.target.value.toUpperCase() })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Origin"
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Destination"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Carrier"
            value={form.carrier}
            onChange={(e) => setForm({ ...form, carrier: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Region"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            placeholder="Distance (km)"
            value={form.distanceKm}
            onChange={(e) => setForm({ ...form, distanceKm: Number(e.target.value) })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="datetime-local"
            value={form.estimatedDeliveryAt.slice(0, 16)}
            onChange={(e) =>
              setForm({ ...form, estimatedDeliveryAt: new Date(e.target.value).toISOString() })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {create.isPending ? "Saving…" : "Save"}
          </button>
          {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by tracking code"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as DeliveryStatus | "")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {deliveryStatusSchema.options.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingState label="Loading deliveries…" />}
      {error && <ErrorState message={error.message} />}
      {data && data.items.length === 0 && <EmptyState label="No deliveries match your filters" />}
      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Est. delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-brand-700">
                    <Link to={`/deliveries/${d.id}`}>{d.trackingCode}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.origin} → {d.destination}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.carrier}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(d.estimatedDeliveryAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
