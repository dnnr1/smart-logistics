import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useDelivery } from "../hooks/useApi";
import { StatusBadge } from "../components/StatusBadge";
import { ErrorState, LoadingState } from "../components/States";

export function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useDelivery(id);

  if (isLoading) return <LoadingState label="Loading delivery…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <ErrorState message="Delivery not found" />;

  return (
    <div className="space-y-6">
      <Link
        to="/deliveries"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to deliveries
      </Link>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.trackingCode}</h1>
          <p className="text-sm text-slate-500">
            {data.origin} → {data.destination}
          </p>
        </div>
        <StatusBadge status={data.status} />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Carrier" value={data.carrier} />
        <Field label="Region" value={data.region} />
        <Field label="Distance" value={`${data.distanceKm} km`} />
        <Field
          label="Estimated delivery"
          value={new Date(data.estimatedDeliveryAt).toLocaleString()}
        />
        {data.actualDeliveryAt && (
          <Field label="Actual delivery" value={new Date(data.actualDeliveryAt).toLocaleString()} />
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">History</h2>
        <ol className="relative space-y-4 border-l border-slate-200 pl-4">
          {data.events.map((e) => (
            <li key={e.eventId}>
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-brand-500" />
              <div className="flex items-center gap-2">
                <StatusBadge status={e.status} />
                <span className="text-xs text-slate-400">
                  {new Date(e.occurredAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {e.location}
                {e.note ? ` · ${e.note}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
