"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Fuel,
  DollarSign,
  Percent,
  Gauge,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { fetchConfig, updateConfig } from "@/lib/api-client";
import { SimulationConfig } from "@/lib/types";
import defaultsData from "../../config/defaults.json";

export default function ConfigManager() {
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Local state fields
  const [fuelPrice, setFuelPrice] = useState<number>(278);
  const [effHatch, setEffHatch] = useState<number>(15);
  const [effSedan, setEffSedan] = useState<number>(12);
  const [effSuv, setEffSuv] = useState<number>(9);
  const [platformFeeRate, setPlatformFeeRate] = useState<number>(0.05);
  const [driverCommission, setDriverCommission] = useState<number>(0.8);
  const [minVariance, setMinVariance] = useState<number>(0.85);
  const [maxVariance, setMaxVariance] = useState<number>(1.15);
  const [minTrips, setMinTrips] = useState<number>(3);
  const [maxTrips, setMaxTrips] = useState<number>(6);
  const [weightRide, setWeightRide] = useState<number>(0.7);
  const [weightRental, setWeightRental] = useState<number>(0.2);
  const [weightWedding, setWeightWedding] = useState<number>(0.1);
  const [fareHatch, setFareHatch] = useState<number>(55);
  const [fareSedan, setFareSedan] = useState<number>(75);
  const [fareSuv, setFareSuv] = useState<number>(110);
  const [weekendSeasonality, setWeekendSeasonality] = useState<number>(1.1);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await fetchConfig();
      setConfig(cfg);

      setFuelPrice(cfg.fuel_price_per_liter ?? 278);

      const eff = cfg.fuel_efficiency_km_per_liter;
      if (typeof eff === "object") {
        setEffHatch(eff.hatchback ?? 15);
        setEffSedan(eff.sedan ?? 12);
        setEffSuv(eff.suv ?? 9);
      } else if (typeof eff === "number") {
        setEffHatch(eff);
        setEffSedan(eff);
        setEffSuv(eff);
      }

      setPlatformFeeRate(cfg.platform_fee_rate ?? 0.05);
      setDriverCommission(cfg.driver_commission_split ?? 0.8);

      const vRange = cfg.variance_range || [0.85, 1.15];
      setMinVariance(vRange[0]);
      setMaxVariance(vRange[1]);

      const tRange = cfg.trip_count_range_per_day || [3, 6];
      setMinTrips(tRange[0]);
      setMaxTrips(tRange[1]);

      const cWeights = cfg.category_weights || {
        ride_hailing: 0.7,
        self_drive_rental: 0.2,
        wedding_event: 0.1,
      };
      setWeightRide(cWeights.ride_hailing ?? 0.7);
      setWeightRental(cWeights.self_drive_rental ?? 0.2);
      setWeightWedding(cWeights.wedding_event ?? 0.1);

      const fares = cfg.fare_rate_per_km_by_category || {
        hatchback: 55,
        sedan: 75,
        suv: 110,
      };
      setFareHatch(fares.hatchback ?? 55);
      setFareSedan(fares.sedan ?? 75);
      setFareSuv(fares.suv ?? 110);

      setWeekendSeasonality(cfg.seasonality_multipliers?.weekend ?? 1.1);
    } catch (err: any) {
      setError(err.message || "Failed to load simulation configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveParam = async (key: string, value: any) => {
    setSavingKey(key);
    try {
      await updateConfig(key, value, "investor-dashboard@carnaq");
      showToast(`Updated '${key}' successfully!`);
    } catch (err: any) {
      setError(`Failed to update ${key}: ${err.message}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingKey("all");
    try {
      await Promise.all([
        updateConfig("fuel_price_per_liter", fuelPrice),
        updateConfig("fuel_efficiency_km_per_liter", {
          hatchback: effHatch,
          sedan: effSedan,
          suv: effSuv,
        }),
        updateConfig("platform_fee_rate", platformFeeRate),
        updateConfig("driver_commission_split", driverCommission),
        updateConfig("variance_range", [minVariance, maxVariance]),
        updateConfig("trip_count_range_per_day", [minTrips, maxTrips]),
        updateConfig("category_weights", {
          ride_hailing: weightRide,
          self_drive_rental: weightRental,
          wedding_event: weightWedding,
        }),
        updateConfig("fare_rate_per_km_by_category", {
          hatchback: fareHatch,
          sedan: fareSedan,
          suv: fareSuv,
        }),
        updateConfig("seasonality_multipliers", {
          weekend: weekendSeasonality,
        }),
      ]);
      showToast("All simulation parameters updated successfully!");
    } catch (err: any) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to reset all parameters to default values?"))
      return;
    setSavingKey("reset");
    try {
      const defs = defaultsData as any;
      for (const [k, v] of Object.entries(defs)) {
        await updateConfig(k, v);
      }
      await loadConfig();
      showToast("Reset all parameters to canonical defaults!");
    } catch (err: any) {
      setError(`Reset failed: ${err.message}`);
    } finally {
      setSavingKey(null);
    }
  };

  const totalWeights = Math.round((weightRide + weightRental + weightWedding) * 100) / 100;

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
        <Sliders className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading simulation configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Global Save */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-brand-400" />
            <span>Simulation Parameters Control Center</span>
          </h3>
          <p className="text-xs text-slate-400">
            Tune fuel prices, vehicle efficiencies, platform fees, variance bounds, and trip mix live.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetDefaults}
            disabled={savingKey !== null}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-slate-300 border border-white/10 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Defaults</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={savingKey !== null}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-brand-500 text-dark-950 hover:bg-brand-400 transition-all shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{savingKey === "all" ? "Saving All..." : "Save All Parameters"}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-brand-500/15 border border-brand-500/30 text-xs text-brand-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-brand-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Fuel & Efficiencies */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 mb-2">
              <Fuel className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Fuel & Efficiencies
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Directly influences operating expenses in trip generation.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fuel Price (PKR / Liter)
                </label>
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Fuel Efficiency (km / liter)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      Hatchback
                    </span>
                    <input
                      type="number"
                      value={effHatch}
                      onChange={(e) => setEffHatch(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-dark-800 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      Sedan
                    </span>
                    <input
                      type="number"
                      value={effSedan}
                      onChange={(e) => setEffSedan(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-dark-800 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      SUV
                    </span>
                    <input
                      type="number"
                      value={effSuv}
                      onChange={(e) => setEffSuv(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-dark-800 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              handleSaveParam("fuel_price_per_liter", fuelPrice).then(() =>
                handleSaveParam("fuel_efficiency_km_per_liter", {
                  hatchback: effHatch,
                  sedan: effSedan,
                  suv: effSuv,
                })
              )
            }
            disabled={savingKey !== null}
            className="w-full py-2 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-white border border-white/10 transition-all flex items-center justify-center space-x-1"
          >
            <Save className="w-3.5 h-3.5 text-brand-400" />
            <span>Save Fuel Settings</span>
          </button>
        </div>

        {/* Card 2: Platform Fees & Splits */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-400 mb-2">
              <Percent className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Platform Fees & Splits
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              CarNAQ platform cut and driver revenue split allocations.
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Platform Fee Rate
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    {Math.round(platformFeeRate * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.25"
                  step="0.01"
                  value={platformFeeRate}
                  onChange={(e) => setPlatformFeeRate(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Driver Commission Split
                  </label>
                  <span className="text-xs font-mono font-bold text-brand-400">
                    {Math.round(driverCommission * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.01"
                  value={driverCommission}
                  onChange={(e) => setDriverCommission(Number(e.target.value))}
                  className="w-full accent-brand-400 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Weekend Seasonality Boost
                  </label>
                  <span className="text-xs font-mono font-bold text-white">
                    {weekendSeasonality}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.5"
                  step="0.05"
                  value={weekendSeasonality}
                  onChange={(e) => setWeekendSeasonality(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              handleSaveParam("platform_fee_rate", platformFeeRate).then(() =>
                handleSaveParam("driver_commission_split", driverCommission)
              )
            }
            disabled={savingKey !== null}
            className="w-full py-2 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-white border border-white/10 transition-all flex items-center justify-center space-x-1"
          >
            <Save className="w-3.5 h-3.5 text-purple-400" />
            <span>Save Platform Splits</span>
          </button>
        </div>

        {/* Card 3: Rates per Kilometer */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-brand-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Ride-Hailing Rates / KM
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Base tariff charged per kilometer for each vehicle class.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hatchback (PKR / km)
                </label>
                <input
                  type="number"
                  value={fareHatch}
                  onChange={(e) => setFareHatch(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sedan (PKR / km)
                </label>
                <input
                  type="number"
                  value={fareSedan}
                  onChange={(e) => setFareSedan(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SUV (PKR / km)
                </label>
                <input
                  type="number"
                  value={fareSuv}
                  onChange={(e) => setFareSuv(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              handleSaveParam("fare_rate_per_km_by_category", {
                hatchback: fareHatch,
                sedan: fareSedan,
                suv: fareSuv,
              })
            }
            disabled={savingKey !== null}
            className="w-full py-2 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-white border border-white/10 transition-all flex items-center justify-center space-x-1"
          >
            <Save className="w-3.5 h-3.5 text-brand-400" />
            <span>Save Tariffs</span>
          </button>
        </div>

        {/* Card 4: Variance & Daily Trips Range */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <Gauge className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Variance & Trip Ranges
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Controls stochastic volatility and daily dispatch volume per vehicle.
            </p>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Variance Factor Range (Min - Max)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.05"
                    value={minVariance}
                    onChange={(e) => setMinVariance(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="0.05"
                    value={maxVariance}
                    onChange={(e) => setMaxVariance(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  e.g. 0.85 (-15%) to 1.15 (+15%)
                </span>
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Trips Per Day Range
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={minTrips}
                    onChange={(e) => setMinTrips(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs font-mono"
                  />
                  <input
                    type="number"
                    value={maxTrips}
                    onChange={(e) => setMaxTrips(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Min & max trips simulated per vehicle daily
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              handleSaveParam("variance_range", [minVariance, maxVariance]).then(
                () => handleSaveParam("trip_count_range_per_day", [minTrips, maxTrips])
              )
            }
            disabled={savingKey !== null}
            className="w-full py-2 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-white border border-white/10 transition-all flex items-center justify-center space-x-1"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
            <span>Save Variance Settings</span>
          </button>
        </div>

        {/* Card 5: Category Mix Weights */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 md:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Sliders className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Trip Category Mix Distribution
                </h4>
              </div>

              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  totalWeights === 1.0
                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                Sum: {Math.round(totalWeights * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Relative probabilities determining whether a trip is Ride-Hailing, Self-Drive Rental, or Wedding/Event.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ride-Hailing Weight
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={weightRide}
                  onChange={(e) => setWeightRide(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-sm font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {Math.round(weightRide * 100)}% of standard trips
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Self-Drive Rental Weight
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={weightRental}
                  onChange={(e) => setWeightRental(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-sm font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {Math.round(weightRental * 100)}% flat-rate rentals
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wedding / Event Weight
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={weightWedding}
                  onChange={(e) => setWeightWedding(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-white text-sm font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {Math.round(weightWedding * 100)}% premium bookings
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              handleSaveParam("category_weights", {
                ride_hailing: weightRide,
                self_drive_rental: weightRental,
                wedding_event: weightWedding,
              })
            }
            disabled={savingKey !== null}
            className="w-full py-2 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-white border border-white/10 transition-all flex items-center justify-center space-x-1"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save Category Mix Weights</span>
          </button>
        </div>
      </div>
    </div>
  );
}
