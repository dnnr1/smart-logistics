import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import type { RiskResult } from "@smart-logistics/shared";
import { usePrediction } from "../hooks/useApi";
import { ErrorState } from "../components/States";

export function RiskPage() {
  const [deliveryId, setDeliveryId] = useState("");
  const [result, setResult] = useState<RiskResult | null>(null);
  const predict = usePrediction();

  async function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    try {
      setResult(await predict.mutateAsync({ deliveryId }));
    } catch {
      /* surfaced via predict.error */
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Risk analysis</h1>
        <p className="text-sm text-slate-500">
          Explainable delivery-delay risk. This is a demonstration heuristic, not a trained ML
          model.
        </p>
      </header>

      <form
        onSubmit={onAnalyze}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row"
      >
        <input
          required
          value={deliveryId}
          onChange={(e) => setDeliveryId(e.target.value)}
          placeholder="Delivery id (e.g. del-0003)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={predict.isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {predict.isPending ? "Analyzing…" : "Analyze risk"}
        </button>
      </form>

      {predict.isError && <ErrorState message={predict.error.message} />}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="rounded-lg bg-slate-100 p-3 text-brand-600">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Risk score</p>
              <p className="text-3xl font-semibold">
                {result.score}
                <span className="ml-2 align-middle text-base font-medium capitalize text-slate-500">
                  {result.level}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Contributing factors</h2>
              <ul className="space-y-2">
                {result.factors.map((f) => (
                  <li key={f.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{f.detail}</span>
                    <span className="font-medium text-slate-800">+{f.contribution}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Recommended actions</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {result.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
