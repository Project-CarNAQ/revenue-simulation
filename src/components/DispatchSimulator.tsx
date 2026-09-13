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

interface VehicleSignal {
  id: string;
  className: VehicleCategory;
  x: number;
  y: number;
  heading: number;
  speed: number;
  accuracy: number;
  trail: { x: number; y: number }[];
  status: "moving" | "idle";
}

const SIGNAL_COLORS: Record<VehicleCategory, string> = {
  sedan: "#c1f11d",
  suv: "#45d6c6",
  hatchback: "#ffbd59",
};

const VEHICLE_SEEDS: Omit<VehicleSignal, "trail">[] = [
  { id: "E201", className: "sedan", x: 23, y: 67, heading: 18, speed: 42, accuracy: 3, status: "moving" },
  { id: "9A41", className: "suv", x: 69, y: 31, heading: 142, speed: 28, accuracy: 5, status: "moving" },
  { id: "78B2", className: "hatchback", x: 78, y: 70, heading: 218, speed: 0, accuracy: 4, status: "idle" },
  { id: "3F89", className: "sedan", x: 38, y: 28, heading: 307, speed: 56, accuracy: 3, status: "moving" },
  { id: "B614", className: "suv", x: 55, y: 78, heading: 84, speed: 34, accuracy: 6, status: "moving" },
];

function createSignals(): VehicleSignal[] {
  return VEHICLE_SEEDS.map((vehicle) => ({
    ...vehicle,
    trail: [{ x: vehicle.x, y: vehicle.y }],
  }));
}

export default function DispatchSimulator() {
  const [city, setCity] = useState("Lahore");
  const [activeVehiclesCount, setActiveVehiclesCount] = useState(14);
  const [liveTrips, setLiveTrips] = useState<SimulatedLiveTrip[]>([]);
  const [signals, setSignals] = useState<VehicleSignal[]>(createSignals);
  const [selectedSignalId, setSelectedSignalId] = useState("E201");

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

  useEffect(() => {
    setSignals(createSignals());
    setSelectedSignalId("E201");

    const interval = setInterval(() => {
      setSignals((previous) =>
        previous.map((vehicle) => {
          if (vehicle.status === "idle") return vehicle;

          const radians = (vehicle.heading * Math.PI) / 180;
          const nextX = vehicle.x + Math.sin(radians) * 0.9;
          const nextY = vehicle.y - Math.cos(radians) * 0.9;
          const bouncedX = nextX < 10 || nextX > 90;
          const bouncedY = nextY < 10 || nextY > 90;
          const nextHeading = bouncedX || bouncedY
            ? (vehicle.heading + (bouncedX ? 180 : 0) + (bouncedY ? 180 : 0)) % 360
            : vehicle.heading;
          const x = Math.max(10, Math.min(90, nextX));
          const y = Math.max(10, Math.min(90, nextY));

          return {
            ...vehicle,
            x,
            y,
            heading: nextHeading,
            trail: [...vehicle.trail, { x, y }].slice(-18),
          };
        })
      );
    }, 900);

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
        {/* Live GPS telemetry map */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-white/10 p-4 relative overflow-hidden min-h-[430px]">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">Live GPS telemetry</p>
              <p className="text-sm font-bold text-white">{city} operating area</p>
            </div>
            <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-2 py-1">POLL 0.9s</span>
          </div>

          <div className="relative aspect-square max-h-[340px] mx-auto rounded-xl overflow-hidden border border-white/10 bg-[#18211e]">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(193,241,29,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(193,241,29,.08) 1px, transparent 1px)", backgroundSize: "12.5% 12.5%" }} />
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-label={`Simulated GPS map of ${city}`}>
              <g stroke="#66736b" strokeWidth="0.8" opacity="0.42" fill="none">
                <path d="M-5 18 C20 25 25 8 48 18 S75 32 105 17" />
                <path d="M-5 43 C18 32 26 54 48 42 S77 35 105 49" />
                <path d="M-5 73 C20 63 31 83 53 68 S78 64 105 80" />
                <path d="M18 -5 C27 19 12 33 27 52 S17 79 25 105" />
                <path d="M57 -5 C46 19 68 30 55 48 S64 77 53 105" />
                <path d="M82 -5 C70 21 91 35 77 55 S91 78 78 105" />
              </g>
              <g stroke="#a8b5aa" strokeWidth="0.28" opacity="0.65" fill="none">
                <path d="M0 30 L100 30 M0 59 L100 59 M36 0 L36 100 M68 0 L68 100" />
              </g>
              <circle cx="50" cy="50" r="37" fill="none" stroke="#c1f11d" strokeOpacity=".18" strokeWidth=".6" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="#c1f11d" strokeOpacity=".22" strokeWidth=".6" />
              <circle cx="50" cy="50" r="12" fill="none" stroke="#c1f11d" strokeOpacity=".28" strokeWidth=".6" />
              <line x1="50" y1="8" x2="50" y2="92" stroke="#c1f11d" strokeOpacity=".16" strokeWidth=".4" />
              <line x1="8" y1="50" x2="92" y2="50" stroke="#c1f11d" strokeOpacity=".16" strokeWidth=".4" />
              {signals.map((vehicle) => (
                <g key={vehicle.id} onClick={() => setSelectedSignalId(vehicle.id)} className="cursor-pointer">
                  <polyline points={vehicle.trail.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={SIGNAL_COLORS[vehicle.className]} strokeOpacity=".56" strokeWidth="1.1" strokeDasharray="1.5 1.5" />
                  <circle cx={vehicle.x} cy={vehicle.y} r={selectedSignalId === vehicle.id ? 4.2 : 2.8} fill={SIGNAL_COLORS[vehicle.className]} fillOpacity=".13" stroke={SIGNAL_COLORS[vehicle.className]} strokeWidth=".55" />
                  <circle cx={vehicle.x} cy={vehicle.y} r="1.35" fill={SIGNAL_COLORS[vehicle.className]} />
                  <g transform={`translate(${vehicle.x + 2}, ${vehicle.y - 4})`}>
                    <rect width="12" height="4.5" rx="1" fill="#141a17" fillOpacity=".88" />
                    <text x="1.5" y="3.2" fill={SIGNAL_COLORS[vehicle.className]} fontSize="2.5" fontFamily="monospace">{vehicle.id}</text>
                  </g>
                </g>
              ))}
            </svg>
            <div className="absolute inset-0 pointer-events-none rounded-full animate-spin [animation-duration:5s]" style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(193,241,29,.24) 22deg, transparent 48deg)", transformOrigin: "50% 50%" }} />
            <span className="absolute left-2 top-2 text-[9px] font-mono text-[#c1f11d]/70">31.5204° N</span>
            <span className="absolute right-2 bottom-2 text-[9px] font-mono text-[#c1f11d]/70">74.3587° E</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>{activeVehiclesCount} connected units</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" /> GPS lock stable</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {signals.slice(0, 3).map((vehicle) => (
              <button key={vehicle.id} onClick={() => setSelectedSignalId(vehicle.id)} className={`text-left rounded-lg border p-2 ${selectedSignalId === vehicle.id ? "border-brand-500/50 bg-brand-500/10" : "border-white/10 bg-dark-900/40"}`}>
                <span className="block text-[10px] font-bold" style={{ color: SIGNAL_COLORS[vehicle.className] }}>● {vehicle.id}</span>
                <span className="block text-[9px] text-slate-400 mt-1">{vehicle.status === "idle" ? "Parked" : `${vehicle.speed} km/h`}</span>
              </button>
            ))}
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
