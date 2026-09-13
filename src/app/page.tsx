"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FleetOverview from "@/components/FleetOverview";
import VehicleAnalytics from "@/components/VehicleAnalytics";
import ConfigManager from "@/components/ConfigManager";
import DispatchSimulator from "@/components/DispatchSimulator";
import ApiDocs from "@/components/ApiDocs";
import AddVehicleModal from "@/components/AddVehicleModal";
import {
  fetchVehicles,
  createVehicle,
  seedDemoFleet,
  VehicleProfileItem,
} from "@/lib/api-client";
import { VehicleCategory } from "@/lib/types";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "fleet" | "analytics" | "config" | "dispatch" | "docs"
  >("fleet");
  const [vehicles, setVehicles] = useState<VehicleProfileItem[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      const data = await fetchVehicles();
      setVehicles(data);
      if (data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load fleet vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedDemoFleet();
      await loadVehicles();
      setActiveTab("fleet");
    } catch (err) {
      console.error("Failed to seed demo fleet:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateVehicle = async (data: {
    category: VehicleCategory;
    city: string;
    registered_date: string;
  }) => {
    const created = await createVehicle(
      data.category,
      data.city,
      data.registered_date
    );
    await loadVehicles();
    setSelectedVehicleId(created.id);
  };

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    setActiveTab("analytics");
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
        vehicleCount={vehicles.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {loading ? (
          <div className="glass-panel rounded-2xl p-16 text-center border border-white/10">
            <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-400 font-mono">
              Initializing CarNAQ Revenue Simulation Engine...
            </p>
          </div>
        ) : (
          <>
            {activeTab === "fleet" && (
              <FleetOverview
                vehicles={vehicles}
                onSelectVehicle={handleSelectVehicle}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onSeedDemo={handleSeedDemo}
                isSeeding={isSeeding}
              />
            )}

            {activeTab === "analytics" && (
              <VehicleAnalytics
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
              />
            )}

            {activeTab === "dispatch" && <DispatchSimulator />}

            {activeTab === "config" && <ConfigManager />}

            {activeTab === "docs" && <ApiDocs />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/5 py-4 px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            CarNAQ Revenue Simulation Engine • Standalone Stateless Microservice
          </div>
          
        </div>
      </footer>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateVehicle}
      />
    </div>
  );
}
