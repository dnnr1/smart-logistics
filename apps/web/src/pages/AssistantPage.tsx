import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { useAssistant } from "../hooks/useApi";
import { ErrorState } from "../components/States";

export function AssistantPage() {
  const [question, setQuestion] = useState("");
  const ask = useAssistant();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await ask.mutateAsync({ question });
    } catch {
      /* surfaced via ask.error */
    }
  }

  const unavailable =
    ask.error?.message.includes("not configured") || ask.error?.message.includes("503");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">AI assistant</h1>
        <p className="text-sm text-slate-500">
          Ask grounded questions about logistics operations. Answers use real backend data only.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row"
      >
        <input
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Which regions have the highest delay rates?"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={ask.isPending || question.trim().length < 3}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {ask.isPending ? "Thinking…" : "Ask"}
        </button>
      </form>

      {ask.isError && (
        <ErrorState
          message={
            unavailable
              ? "The AI assistant is not configured on this environment (Amazon Bedrock model access is unavailable)."
              : ask.error.message
          }
        />
      )}

      {ask.data && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand-600">
            <Bot className="h-5 w-5" />
            <span className="text-sm font-semibold">Answer</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{ask.data.answer}</p>
          {ask.data.sources.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs uppercase text-slate-400">Grounded in</p>
              <div className="flex flex-wrap gap-2">
                {ask.data.sources.map((s) => (
                  <span
                    key={`${s.type}-${s.label}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                  >
                    {s.label}: {typeof s.value === "number" ? s.value.toFixed(2) : s.value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
