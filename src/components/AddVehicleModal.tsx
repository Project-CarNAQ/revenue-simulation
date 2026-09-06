"use client";

import React, { useState } from "react";
import { Plus, X, Car, MapPin, Calendar } from "lucide-react";
import { VehicleCategory } from "@/lib/types";

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    category: VehicleCategory;
    city: string;
    registered_date: string;
  }) => Promise<void>;
}

export default function AddVehicleModal({
  isOpen,
  onClose,
  onSubmit,
}: AddVehicleModalProps) {
  const [category, setCategory] = useState<VehicleCategory>("sedan");
  const [city, setCity] = useState("Lahore");
  const [registeredDate, setRegisteredDate] = useState("2025-01-15");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ category, city, registered_date: registeredDate });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to register vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-dark-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Onboard Anonymous Vehicle
            </h3>
            <p className="text-xs text-slate-400">
              Generates a new UUID profile. No personal data is ever stored.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Car className="w-3.5 h-3.5 text-brand-400" />
              <span>Vehicle Class</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["hatchback", "sedan", "suv"] as VehicleCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                    category === cat
                      ? "bg-brand-500 text-dark-950 border-brand-400 shadow-md"
                      : "bg-dark-800 text-slate-300 border-white/10 hover:border-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>Operating City</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              <span>Registered Date (Anchor for Day Index)</span>
            </label>
            <input
              type="date"
              value={registeredDate}
              onChange={(e) => setRegisteredDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Deterministic day_index calculations anchor to this date.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-500 text-dark-950 hover:bg-brand-400 transition-all shadow-md flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Onboarding..." : "Register Vehicle"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
