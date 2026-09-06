"use client";

import React, { useState, useEffect } from "react";
import {
  Car,
  TrendingUp,
  DollarSign,
  Fuel,
  Navigation,
  Layers,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ArrowDownRight,
  Sparkles,
  Calculator,
} from "lucide-react";
import {
  VehicleProfileItem,
  fetchVehicleSummary,
  fetchVehicleTrips,
  fetchVehicleTrend,
  checkVehicleAnomaly,
  previewDistribution,
} from "@/lib/api-client";
import {
  SummaryResponse,
  TrendPoint,
  Trip,
  AnomalyCheckResult,
  DistributionPreviewResult,
} from "@/lib/types";

interface VehicleAnalyticsProps {
  vehicles: VehicleProfileItem[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
}

export default function VehicleAnalytics({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}: VehicleAnalyticsProps) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [anomaly, setAnomaly] = useState<AnomalyCheckResult | null>(null);
  const [distribution, setDistribution] =
    useState<DistributionPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;

  useEffect(() => {
    if (!currentVehicle) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadVehicleData() {
      try {
        // 1. Fetch Summary
        const sum = await fetchVehicleSummary(currentVehicle.id, period);
        if (!isMounted) return;
        setSummary(sum);

        // 2. Fetch Trips for the period
        const trps = await fetchVehicleTrips(
          currentVehicle.id,
          sum.period_start,
          sum.period_end
        );
        if (!isMounted) return;
        setTrips(trps);

        // 3. Fetch Trend (30 days)
        const trnd = await fetchVehicleTrend(currentVehicle.id, 14);
        if (!isMounted) return;
        setTrend(trnd);

        // 4. Check Anomaly for period
        const anom = await checkVehicleAnomaly(
          currentVehicle.id,
          sum.period_start,
          sum.period_end
        );
        if (!isMounted) return;
        setAnomaly(anom);

        // 5. Distribution preview
        const dist = await previewDistribution(
          currentVehicle.id,
          sum.period_start,
          sum.period_end
        );
        if (!isMounted) return;
        setDistribution(dist);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load telemetry data");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVehicleData();

    return () => {
      isMounted = false;
    };
  }, [currentVehicle?.id, period]);

  if (!currentVehicle) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
        <Car className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">
          No Vehicle Selected
        </h3>
        <p className="text-xs text-slate-400">
          Please onboard or select a vehicle from the fleet to view detailed telemetry.
        </p>
      </div>
    );
  }

  // Calculate SVG trend line
  const maxNet = Math.max(...trend.map((t) => t.net), 1);
  const minNet = Math.min(...trend.map((t) => t.net), 0);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "ride_hailing":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "self_drive_rental":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "wedding_event":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Vehicle Selector & Period Toggle */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Vehicle Picker */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400 border border-brand-500/30">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <select
                value={currentVehicle.id}
                onChange={(e) => onSelectVehicle(e.target.value)}
                className="bg-dark-800 border border-white/15 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.category.toUpperCase()} • {v.city} (#{v.id.slice(0, 8)})
                  </option>
                ))}
              </select>

              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                Registered {currentVehicle.registered_date}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic calculation anchor:{" "}
              <span className="font-mono text-slate-300">{currentVehicle.id}</span>
            </p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-dark-900 rounded-xl p-1 border border-white/10 self-start md:self-auto">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                period === p
                  ? "bg-brand-500 text-dark-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {p === "today"
                ? "Today"
                : p === "week"
                ? "Past 7 Days"
                : "Past 30 Days"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Net Income
            </span>
            <div className="text-xl font-black text-brand-400">
              PKR {summary.net_income.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Distributable</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Gross Fares
            </span>
            <div className="text-xl font-extrabold text-white">
              PKR {summary.gross_revenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Total billings</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Fuel Cost
            </span>
            <div className="text-xl font-extrabold text-amber-400">
              PKR {summary.fuel_cost.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Operating fuel</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Platform Fee
            </span>
            <div className="text-xl font-extrabold text-purple-400">
              PKR {summary.platform_fee.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">CarNAQ cut (5%)</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Completed Trips
            </span>
            <div className="text-xl font-extrabold text-white">
              {summary.trip_count} rides
            </div>
            <span className="text-[10px] text-slate-400">Calculated trips</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Mileage
            </span>
            <div className="text-xl font-extrabold text-white">
              {summary.distance_km} km
            </div>
            <span className="text-[10px] text-slate-400">Distance covered</span>
          </div>
        </div>
      )}

      {/* Anomaly Detection Banner */}
      {anomaly && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            anomaly.flagged
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-brand-500/10 border-brand-500/20 text-brand-300"
          }`}
        >
          <div className="flex items-center space-x-3">
            {anomaly.flagged ? (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
            )}
            <div>
              <span className="text-xs font-bold block">
                {anomaly.flagged
                  ? `Revenue Anomaly Flagged (${anomaly.severity?.toUpperCase()} Severity)`
                  : "Statistical Baseline Healthy"}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {anomaly.flagged
                  ? anomaly.reason
                  : `Reported net (PKR ${anomaly.reported_net.toLocaleString()}) conforms to expected category benchmark [PKR ${anomaly.expected_net_range[0].toLocaleString()} – PKR ${anomaly.expected_net_range[1].toLocaleString()}].`}
              </span>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">
              Benchmark Bounds
            </span>
            <span className="text-xs font-mono font-bold text-white">
              PKR {anomaly.expected_net_range[0].toLocaleString()} - PKR {anomaly.expected_net_range[1].toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Grid: 14-Day Net Trend Chart & Distribution Payout Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (2 columns) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                <span>Daily Net Revenue Trajectory</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Deterministic daily net output reflecting variance and weekend peaks
              </p>
            </div>
          </div>

          {/* Simple Clean Responsive SVG Trend Visualizer */}
          <div className="h-44 w-full relative flex items-end pt-6 pb-2">
            {trend.map((pt, i) => {
              const heightPercent =
                maxNet === minNet ? 50 : Math.max(10, ((pt.net - minNet) / (maxNet - minNet)) * 85);
              const dateObj = new Date(`${pt.date}T00:00:00Z`);
              const isWeekend = dateObj.getUTCDay() === 0 || dateObj.getUTCDay() === 6;

              return (
                <div
                  key={pt.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative px-0.5"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-9 hidden group-hover:flex flex-col items-center z-10 bg-dark-950 border border-white/20 text-white text-[10px] font-mono px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">
                    <span>{pt.date}</span>
                    <span className="text-brand-400 font-bold">
                      PKR {pt.net.toLocaleString()}
                    </span>
                  </div>

                  {/* Bar element */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all group-hover:opacity-100 ${
                      isWeekend
                        ? "bg-gradient-to-t from-purple-500/50 to-purple-400 shadow-sm shadow-purple-500/30"
                        : "bg-gradient-to-t from-brand-600/40 to-brand-400 shadow-sm shadow-brand-500/20"
                    }`}
                  />
                  <span className="text-[9px] text-slate-400 font-mono mt-1 hidden sm:block">
                    {pt.date.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2 mt-1">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-400 inline-block" />
                <span>Weekday</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 inline-block" />
                <span>Weekend (Peak)</span>
              </span>
            </div>
            <span>14-day history</span>
          </div>
        </div>

        {/* Distribution Payout Preview Card */}
        {distribution && (
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-brand-400 mb-2">
                <Calculator className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Distribution Payout Math
                </h4>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Stateless mathematical preview of investor distribution pool for this period.
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Gross Passenger Billings:</span>
                  <span className="font-semibold text-white">
                    PKR {distribution.gross_revenue.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Operating Fuel Deductions:</span>
                  <span className="font-semibold text-amber-400">
                    - PKR {distribution.operating_expenses.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Platform Management Fee:</span>
                  <span className="font-semibold text-purple-400">
                    - PKR {distribution.platform_fee.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 text-sm">
                  <span className="font-bold text-white">
                    Net Distributable:
                  </span>
                  <span className="font-black text-brand-400 text-base">
                    PKR {distribution.net_distributable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-white/5 text-[11px] text-slate-400">
              Formula: Gross − Operating Fuel − Platform Fee. No blockchain or custody logic executed in this microservice.
            </div>
          </div>
        )}
      </div>

      {/* Deterministic Trips Log Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-brand-400" />
              <span>Simulated Trip Ledger ({trips.length} Trips)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Each ride is a deterministic result of (vehicle_id, day_index, trip_index).
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Period: {summary?.period_start} → {summary?.period_end}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-dark-900/60 border-b border-white/5 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Route (Origin → Destination)</th>
                <th className="py-3 px-4 text-right">Distance</th>
                <th className="py-3 px-4 text-right">Gross Fare</th>
                <th className="py-3 px-4 text-right">Fuel Cost</th>
                <th className="py-3 px-4 text-right">Fee</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {trips.map((trip, idx) => (
                <tr
                  key={`${trip.date}-${trip.time}-${idx}`}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 text-slate-300 font-sans">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{trip.time}</span>
                      <span className="text-slate-500 text-[11px]">
                        ({trip.date})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        trip.category
                      )}`}
                    >
                      {trip.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-sans text-slate-200">
                    <span className="text-slate-300">{trip.from_area}</span>
                    <span className="text-brand-400 mx-1.5">→</span>
                    <span className="text-white font-medium">{trip.to_area}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {trip.distance_km} km
                    <span className="text-slate-500 text-[10px] block">
                      {trip.duration_min}m
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">
                    PKR {trip.gross_fare.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-400">
                    PKR {trip.fuel_cost.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-purple-400">
                    PKR {trip.platform_fee.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-brand-400">
                    PKR {trip.net.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
