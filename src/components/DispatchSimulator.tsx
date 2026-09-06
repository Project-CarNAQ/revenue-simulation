"use client";

import React, { useState, useEffect } from "react";
import {
  Radar,
  Car,
  Navigation,
  Clock,
  DollarSign,
  Fuel,
  Sparkles,
  MapPin,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { getAreasForCity } from "@/lib/cities";
import { VehicleCategory, TripCategory } from "@/lib/types";

interface SimulatedLiveTrip {
  id: string;
  category: TripCategory;
  vehicleClass: VehicleCategory;
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  grossFare: number;
  fuelCost: number;
  platformFee: number;
  net: number;
  status: "Searching" | "En Route" | "Completed";
  time: string;
}

export default function DispatchSimulator() {
  const [city, setCity] = useState("Lahore");
  const [activeVehiclesCount, setActiveVehiclesCount] = useState(14);
  const [liveTrips, setLiveTrips] = useState<SimulatedLiveTrip[]>([]);

  const cityAreas = getAreasForCity(city);

  const generateRandomLiveTrip = (): SimulatedLiveTrip => {
    const from = cityAreas[Math.floor(Math.random() * cityAreas.length)];
    let to = cityAreas[Math.floor(Math.random() * cityAreas.length)];
    if (to === from && cityAreas.length > 1) {
      to = cityAreas.find((a) => a !== from) || cityAreas[0];
    }

    const categories: TripCategory[] = [
      "ride_hailing",
      "ride_hailing",
      "ride_hailing",
      "self_drive_rental",
      "wedding_event",
    ];
    const tripCategory =
      categories[Math.floor(Math.random() * categories.length)];

    const vehicleClasses: VehicleCategory[] = ["sedan", "suv", "hatchback"];
    const vehicleClass =
      vehicleClasses[Math.floor(Math.random() * vehicleClasses.length)];

    let distance = 0;
    let gross = 0;

    if (tripCategory === "ride_hailing") {
      distance = Math.round((Math.random() * 20 + 5) * 10) / 10;
      const rate = vehicleClass === "suv" ? 110 : vehicleClass === "sedan" ? 75 : 55;
      gross = Math.round(distance * rate * (0.9 + Math.random() * 0.2));
    } else if (tripCategory === "self_drive_rental") {
      distance = Math.round((Math.random() * 60 + 35) * 10) / 10;
      gross = Math.round(4500 + Math.random() * 3000);
    } else {
      distance = Math.round((Math.random() * 40 + 20) * 10) / 10;
      gross = Math.round(9000 + Math.random() * 8000);
    }

    const efficiency = vehicleClass === "suv" ? 9 : vehicleClass === "sedan" ? 12 : 15;
    const fuel = Math.round(distance * (278 / efficiency));
    const fee = Math.round(gross * 0.05);
    const net = gross - fuel - fee;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    return {
      id: Math.random().toString(36).slice(2, 9).toUpperCase(),
      category: tripCategory,
      vehicleClass,
      from,
      to,
      distanceKm: distance,
      durationMin: Math.round(distance * 2.5 + 8),
      grossFare: gross,
      fuelCost: fuel,
      platformFee: fee,
      net,
      status: "En Route",
      time: timeStr,
    };
  };

  useEffect(() => {
    // Initial 4 trips
    const initial: SimulatedLiveTrip[] = [
      generateRandomLiveTrip(),
      generateRandomLiveTrip(),
      generateRandomLiveTrip(),
      generateRandomLiveTrip(),
    ];
    setLiveTrips(initial);

    // Stream incoming dispatches every 6 seconds
    const interval = setInterval(() => {
      setLiveTrips((prev) => [generateRandomLiveTrip(), ...prev.slice(0, 9)]);
    }, 6000);

    return () => clearInterval(interval);
  }, [city]);

  const handleManualDispatch = () => {
    setLiveTrips((prev) => [generateRandomLiveTrip(), ...prev.slice(0, 9)]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
            <Radar className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Careem & Uber-Style Dispatch Radar</span>
              <span className="flex items-center space-x-1 text-[10px] text-brand-400 bg-brand-500/15 px-2 py-0.5 rounded-full border border-brand-500/20 font-mono">
                <Radio className="w-2.5 h-2.5 animate-ping" />
                <span>LIVE SIMULATION</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time simulated telemetry for anonymous fleet vehicles in metropolitan hubs.
            </p>
          </div>
        </div>

        {/* City Selector & Dispatch Trigger */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-dark-900 rounded-xl p-1 border border-white/10 text-xs">
            {["Lahore", "Karachi", "Islamabad"].map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  city === c
                    ? "bg-brand-500 text-dark-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualDispatch}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-500 text-dark-950 hover:bg-brand-400 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Dispatch</span>
          </button>
        </div>
      </div>

      {/* Grid: Visual Radar Map & Live Trip Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Map / Radar (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[380px]">
          {/* Background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

          {/* Radar Circles */}
          <div className="relative w-64 h-64 rounded-full border border-brand-500/20 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border border-brand-500/25 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-brand-500/35 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-brand-500/50 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-brand-400 glow-emerald animate-ping" />
                </div>
              </div>
            </div>

            {/* Sweep radar hand */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none animate-spin [animation-duration:8s]">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-brand-500/30 to-transparent origin-bottom-right" />
            </div>

            {/* Simulated Vehicles on Map */}
            <div className="absolute top-10 left-16 flex items-center space-x-1 bg-dark-950/80 px-2 py-0.5 rounded border border-purple-500/40 text-[10px] text-purple-300 font-mono shadow-lg">
              <Car className="w-2.5 h-2.5 text-purple-400" />
              <span>SUV #9A41</span>
            </div>

            <div className="absolute bottom-12 left-10 flex items-center space-x-1 bg-dark-950/80 px-2 py-0.5 rounded border border-brand-500/40 text-[10px] text-brand-300 font-mono shadow-lg">
              <Car className="w-2.5 h-2.5 text-brand-400" />
              <span>Sedan #E201</span>
            </div>

            <div className="absolute top-16 right-10 flex items-center space-x-1 bg-dark-950/80 px-2 py-0.5 rounded border border-blue-500/40 text-[10px] text-blue-300 font-mono shadow-lg">
              <Car className="w-2.5 h-2.5 text-blue-400" />
              <span>Hatch #78B2</span>
            </div>

            <div className="absolute bottom-16 right-14 flex items-center space-x-1 bg-dark-950/80 px-2 py-0.5 rounded border border-brand-500/40 text-[10px] text-brand-300 font-mono shadow-lg">
              <Car className="w-2.5 h-2.5 text-brand-400" />
              <span>Sedan #3F89</span>
            </div>
          </div>

          <div className="mt-5 text-center z-10">
            <span className="text-xs font-bold text-white block">
              {city} Metropolitan Mobility Sector
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeVehiclesCount} Connected Fleet Units • Active GPS Polling
            </span>
          </div>
        </div>

        {/* Live Trip Activity Stream (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-brand-400 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Live Dispatched Trips Feed
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-refreshing stream
            </span>
          </div>

          <div className="divide-y divide-white/5 overflow-y-auto max-h-[360px]">
            {liveTrips.map((t) => (
              <div
                key={t.id}
                className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-400 text-[11px]">
                      {t.time}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {t.vehicleClass}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300">
                      {t.category.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-slate-500 text-[10px]">
                      #{t.id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-white font-medium">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{t.from}</span>
                    <span className="text-brand-400">→</span>
                    <span>{t.to}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                    <span>{t.distanceKm} km</span>
                    <span>•</span>
                    <span>~{t.durationMin} mins</span>
                    <span>•</span>
                    <span className="text-amber-400">
                      Fuel: PKR {t.fuelCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-white/10 sm:pl-4 shrink-0">
                  <div className="text-slate-400 text-[10px] uppercase">
                    Investor Net
                  </div>
                  <div className="text-sm font-black text-brand-400 font-mono">
                    PKR {t.net.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Gross: PKR {t.grossFare.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-dark-900/60 border-t border-white/5 text-center text-[11px] text-slate-400">
            Simulated live dispatches generated continuously according to current simulation configuration.
          </div>
        </div>
      </div>
    </div>
  );
}
