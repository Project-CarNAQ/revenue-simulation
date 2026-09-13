"use client";

import React, { useState } from "react";
import { BookOpen, Check, Copy, ExternalLink, KeyRound } from "lucide-react";

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  detail: string;
  example?: string;
  response?: string;
}

const endpointGroups: { title: string; description: string; endpoints: Endpoint[] }[] = [
  {
    title: "Configuration",
    description: "Read and update the deterministic simulation parameters.",
    endpoints: [
      {
        method: "GET",
        path: "/api/config",
        summary: "Read simulation config",
        detail: "Returns the current key-value configuration used by the revenue engine.",
        response: '{ "fuel_price_per_liter": 278, "platform_fee_rate": 0.05 }',
      },
      {
        method: "PATCH",
        path: "/api/config",
        summary: "Update one parameter",
        detail: "Updates one configuration key and records who changed it.",
        example: '{ "key": "fuel_price_per_liter", "value": 285, "updated_by": "admin@carnaq" }',
        response: '{ "key": "fuel_price_per_liter", "value": 285 }',
      },
    ],
  },
  {
    title: "Vehicle profiles",
    description: "Manage the small, authoritative fleet profile table.",
    endpoints: [
      {
        method: "GET",
        path: "/api/vehicles",
        summary: "List vehicles",
        detail: "Returns registered vehicles ordered by creation time.",
        response: '[{ "id": "uuid", "category": "sedan", "city": "Lahore" }]',
      },
      {
        method: "POST",
        path: "/api/vehicles",
        summary: "Register a vehicle",
        detail: "Creates a vehicle profile used as the deterministic calculation anchor.",
        example: '{ "category": "sedan", "city": "Lahore", "registered_date": "2025-01-15" }',
        response: '{ "id": "uuid", "category": "sedan", "city": "Lahore", "registered_date": "2025-01-15" }',
      },
      {
        method: "PATCH",
        path: "/api/vehicles/:id",
        summary: "Edit a vehicle",
        detail: "Updates the category or operating city for an existing profile.",
        example: '{ "category": "suv", "city": "Karachi" }',
      },
      {
        method: "DELETE",
        path: "/api/vehicles/:id",
        summary: "Remove a vehicle",
        detail: "Deletes the vehicle profile and returns 204 No Content.",
      },
    ],
  },
  {
    title: "Analytics & distribution",
    description: "Generate deterministic trips and investor-facing calculations on demand.",
    endpoints: [
      {
        method: "GET",
        path: "/api/vehicles/:id/trips",
        summary: "Generate trips",
        detail: "Generates deterministic trips for a date range. No trip rows are stored.",
        example: "?from=2025-09-01&to=2025-09-07",
        response: '[{ "date": "2025-09-01", "distance_km": 14.2, "gross_fare": 1050.25, "net": 668.76 }]',
      },
      {
        method: "GET",
        path: "/api/vehicles/:id/summary",
        summary: "Read financial summary",
        detail: "Aggregates the deterministic output for today, week, or month.",
        example: "?period=week",
        response: '{ "trip_count": 42, "gross_revenue": 21500, "net_income": 15225, "distance_km": 384.5 }',
      },
      {
        method: "GET",
        path: "/api/vehicles/:id/trend",
        summary: "Read revenue trend",
        detail: "Returns daily net points for charting.",
        example: "?days=30",
        response: '[{ "date": "2025-09-01", "net": 2450.50 }]',
      },
      {
        method: "POST",
        path: "/api/vehicles/:id/anomaly-check",
        summary: "Check for anomalies",
        detail: "Compares reported net against the expected category baseline range.",
        example: '{ "period_start": "2025-09-01", "period_end": "2025-09-07" }',
        response: '{ "flagged": false, "severity": null, "expected_net_range": [12800, 21500] }',
      },
      {
        method: "POST",
        path: "/api/distribute/preview",
        summary: "Preview distribution",
        detail: "Calculates the investor distribution without persisting a transaction.",
        example: '{ "vehicle_id": "uuid", "period_start": "2025-09-01", "period_end": "2025-09-07" }',
        response: '{ "gross_revenue": 21500, "operating_expenses": 5200, "net_distributable": 15225 }',
      },
    ],
  },
];

const methodStyles: Record<Endpoint["method"], string> = {
  GET: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  POST: "bg-brand-500/20 text-[#4c5f00] border-brand-500/40",
  PATCH: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  DELETE: "bg-red-500/10 text-red-700 border-red-500/25",
};

export default function ApiDocs() {
  const [copied, setCopied] = useState(false);

  const copyAuthHeader = async () => {
    await navigator.clipboard.writeText("Authorization: Bearer <SIMULATION_API_KEY>");
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-2xl p-6 lg:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-bl from-brand-500/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-brand-400 mb-3">
              <BookOpen className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Developer reference</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white">CarNAQ API docs</h1>
            <p className="text-sm text-slate-400 mt-3 leading-6">A deterministic mobility revenue engine. Generate the same trip economics from the same vehicle, date, and configuration inputs every time.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            v1 · Node.js runtime
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-400 shrink-0"><KeyRound className="w-4 h-4" /></div>
          <div>
            <h2 className="text-sm font-bold text-white">Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Every endpoint requires a shared Bearer token.</p>
          </div>
        </div>
        <button onClick={copyAuthHeader} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-dark-900 text-xs font-mono text-slate-300 hover:border-brand-500/50">
          {copied ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy auth header"}</span>
        </button>
      </section>

      {endpointGroups.map((group) => (
        <section key={group.title}>
          <div className="mb-3">
            <h2 className="text-xl font-bold text-white">{group.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{group.description}</p>
          </div>
          <div className="space-y-3">
            {group.endpoints.map((endpoint) => (
              <article key={`${endpoint.method}-${endpoint.path}`} className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-brand-500/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 rounded-md border text-[10px] font-black tracking-wider ${methodStyles[endpoint.method]}`}>{endpoint.method}</span>
                      <code className="text-sm text-white font-mono break-all">{endpoint.path}</code>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-3">{endpoint.summary}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-5">{endpoint.detail}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono shrink-0"><ExternalLink className="w-3 h-3" /> live route</span>
                </div>
                {(endpoint.example || endpoint.response) && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-4">
                    {endpoint.example && <CodeBlock label="Request" value={endpoint.example} />}
                    {endpoint.response && <CodeBlock label="Response" value={endpoint.response} />}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#171d1a] overflow-hidden">
      <div className="px-3 py-2 border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <pre className="px-3 py-3 text-[11px] leading-5 text-[#d9f6a0] font-mono whitespace-pre-wrap break-words">{value}</pre>
    </div>
  );
}
