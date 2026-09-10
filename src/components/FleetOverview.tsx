"use client";

import React, { useState, useEffect } from "react";
import {
  Car,
  DollarSign,
  Fuel,
  Navigation,
  Sparkles,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";
import { VehicleProfileItem, fetchVehicleSummary } from "@/lib/api-client";
import { VehicleCategory } from "@/lib/types";
import VerificationThread from "./VerificationThread";

interface FleetOverviewProps {
  vehicles: VehicleProfileItem[];
  onSelectVehicle: (vehicleId: string) => void;
  onOpenAddModal: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
}

interface VehicleQuickStats {
  net_income: number;
  gross_revenue: number;
  fuel_cost: number;
  trip_count: number;
  distance_km: number;
}

export default function FleetOverview({
  vehicles,
  onSelectVehicle,
  onOpenAddModal,
  onSeedDemo,
  isSeeding,
}: FleetOverviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [quickStats, setQuickStats] = useState<Record<string, VehicleQuickStats>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Load 7-day quick summaries for each vehicle
  useEffect(() => {
    if (vehicles.length === 0) return;

    let isMounted = true;
    setLoadingStats(true);

    async function loadStats() {
      const statsMap: Record<string, VehicleQuickStats> = {};
      await Promise.all(
        vehicles.map(async (v) => {
          try {
            const summary = await fetchVehicleSummary(v.id, "week");
            statsMap[v.id] = {
              net_income: summary.net_income,
              gross_revenue: summary.gross_revenue,
              fuel_cost: summary.fuel_cost,
              trip_count: summary.trip_count,
              distance_km: summary.distance_km,
            };
          } catch (e) {
            // fallback if calculation unavailable
            statsMap[v.id] = {
              net_income: 0,
              gross_revenue: 0,
              fuel_cost: 0,
              trip_count: 0,
              distance_km: 0,
            };
          }
        })
      );
      if (isMounted) {
        setQuickStats(statsMap);
        setLoadingStats(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [vehicles]);

  // Aggregate Portfolio Totals
  const portfolioNet = Object.values(quickStats).reduce(
    (sum, s) => sum + s.net_income,
    0
  );
  const portfolioGross = Object.values(quickStats).reduce(
    (sum, s) => sum + s.gross_revenue,
    0
  );
  const portfolioFuel = Object.values(quickStats).reduce(
    (sum, s) => sum + s.fuel_cost,
    0
  );
  const portfolioMileage = Object.values(quickStats).reduce(
    (sum, s) => sum + s.distance_km,
    0
  );

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesCat =
      selectedCategory === "all" || v.category === selectedCategory;
    const matchesCity =
      selectedCity === "all" ||
      v.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesCat && matchesCity;
  });

  const getCategoryBadgeClass = (category: VehicleCategory) => {
    switch (category) {
      case "suv":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "sedan":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "hatchback":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  const calculateDaysActive = (regDate: string) => {
    const start = new Date(`${regDate}T00:00:00Z`).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Headline Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-brand-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Weekly Net Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            PKR {portfolioNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-brand-400 mt-1 flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Net distributable to investor fleet</span>
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Weekly Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            PKR {portfolioGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total passenger & rental billings
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Fuel Expense
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            PKR {portfolioFuel.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Calculated by category fuel efficiencies
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Fleet Distance (7d)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {portfolioMileage.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {vehicles.length} active registered vehicles
          </p>
        </div>
      </div>

      {/* Fleet Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter:</span>
          {/* Category Filter */}
          <div className="flex items-center bg-dark-900 rounded-xl p-1 border border-white/5 text-xs">
            {["all", "sedan", "suv", "hatchback"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                  selectedCategory === cat
                    ? "bg-brand-500 text-dark-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* City Filter */}
          <div className="flex items-center bg-dark-900 rounded-xl p-1 border border-white/5 text-xs">
            {["all", "Lahore", "Karachi", "Islamabad"].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedCity === c
                    ? "bg-brand-500 text-dark-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {c === "all" ? "All Cities" : c}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {vehicles.length === 0 && (
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSeeding ? "Generating..." : "Seed Demo Fleet"}</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 text-dark-950 hover:bg-brand-400 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Car</span>
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/15 flex items-center justify-center text-brand-400 mb-3">
            <Car className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            No Vehicles Found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Onboard your first anonymous vehicle or click Seed Demo Fleet to populate a realistic sample portfolio.
          </p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 transition-all"
            >
              {isSeeding ? "Generating..." : "Generate Demo Fleet"}
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 text-dark-950 hover:bg-brand-400 transition-all"
            >
              Add New Car
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const stats = quickStats[vehicle.id] || {
              net_income: 0,
              gross_revenue: 0,
              fuel_cost: 0,
              trip_count: 0,
              distance_km: 0,
            };
            const daysActive = calculateDaysActive(vehicle.registered_date);

            return (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle(vehicle.id)}
                className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getCategoryBadgeClass(
                          vehicle.category
                        )}`}
                      >
                        {vehicle.category}
                      </span>
                      <span className="text-xs font-medium text-slate-300">
                        {vehicle.city}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      #{vehicle.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Earnings Metric */}
                  <div className="my-4">
                    <div className="text-xs text-slate-400 mb-0.5">
                      7-Day Net Distributable
                    </div>
                    <div className="text-2xl font-black text-white tracking-tight">
                      PKR {stats.net_income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="border-y border-white/5 py-3 mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Verification Thread</div>
                    <VerificationThread />
                  </div>

                  {/* Sub-metrics */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/5 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400 text-[11px] block">
                        Gross Fares:
                      </span>
                      <span className="font-semibold text-white">
                        PKR {stats.gross_revenue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">
                        Fuel Cost:
                      </span>
                      <span className="font-semibold text-amber-400">
                        PKR {stats.fuel_cost.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">
                        Trips (7d):
                      </span>
                      <span className="font-semibold text-white">
                        {stats.trip_count} rides
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">
                        Mileage:
                      </span>
                      <span className="font-semibold text-white">
                        {stats.distance_km} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-2 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Day Index: {daysActive}</span>
                  </span>

                  <span className="text-brand-400 font-bold flex items-center space-x-1 group">
                    <span>Telemetry</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
