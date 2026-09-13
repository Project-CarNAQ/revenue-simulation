"use client";

import React, { useState, useEffect } from "react";
import {
  Car,
  Sliders,
  TrendingUp,
  Radar,
  Key,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { getStoredApiKey, setStoredApiKey } from "@/lib/api-client";

interface NavbarProps {
  activeTab: "fleet" | "analytics" | "config" | "dispatch" | "docs";
  setActiveTab: (tab: "fleet" | "analytics" | "config" | "dispatch" | "docs") => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
  vehicleCount: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onSeedDemo,
  isSeeding,
  vehicleCount,
}: NavbarProps) {
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [currentKey, setCurrentKey] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setCurrentKey(getStoredApiKey());
  }, []);

  const handleSaveKey = () => {
    setStoredApiKey(currentKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setApiKeyModalOpen(false);
    }, 1000);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Microservice Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <Car className="w-6 h-6 text-dark-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                Car<span className="text-brand-400">NAQ</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Revenue engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Fairer fleet decisions through deterministic simulation
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-dark-900/80 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "fleet"
                ? "bg-brand-500 text-dark-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Investor Fleet</span>
            {vehicleCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "fleet"
                    ? "bg-dark-950/20 text-dark-950"
                    : "bg-white/10 text-slate-300"
                }`}
              >
                {vehicleCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "analytics"
                ? "bg-brand-500 text-dark-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Vehicle Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("dispatch")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "dispatch"
                ? "bg-brand-500 text-dark-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>Dispatch Radar</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "config"
                ? "bg-brand-500 text-dark-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "docs"
                ? "bg-brand-500 text-dark-950 shadow-md font-bold"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
            title="API Documentation"
          >
            <BookOpen className="w-4 h-4" />
            <span>API Docs</span>
          </button>
        </nav>

        {/* Actions & API Key */}
        <div className="flex items-center space-x-2">
          
          {vehicleCount === 0 && (
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/30 hover:bg-brand-500/25 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? "Generating..." : "Seed Demo Fleet"}</span>
            </button>
          )}

          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-850 hover:bg-dark-800 text-slate-300 border border-white/10 transition-all"
            title="Configure API Key"
          >
            <Key className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">API Key</span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-dark-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Microservice API Key
                </h3>
                <p className="text-xs text-slate-400">
                  Shared Bearer key used for authenticating requests.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bearer Token
                </label>
                <input
                  type="password"
                  value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  placeholder="Enter SIMULATION_API_KEY"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {savedSuccess && (
                <div className="flex items-center space-x-2 text-xs text-brand-400 bg-brand-500/10 p-2.5 rounded-lg border border-brand-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>API Key saved successfully!</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setApiKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKey}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 text-dark-950 hover:bg-brand-400 transition-all shadow-md"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
