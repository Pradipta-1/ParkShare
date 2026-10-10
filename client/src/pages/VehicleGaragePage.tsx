import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Plus, Trash2, CheckCircle2, Shield, Zap, X, ArrowLeft } from 'lucide-react';
import { Vehicle, VehicleType } from '../types';
import { api } from '../services/api';

export const VehicleGaragePage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New vehicle form
  const [numberPlate, setNumberPlate] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [color, setColor] = useState<string>('White');
  const [type, setType] = useState<VehicleType>('Car');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchVehicles = async () => {
    try {
      const res = await api.getVehicles();
      if (res.success && Array.isArray(res.data)) {
        setVehicles(res.data);
      } else {
        setVehicles([]);
      }
    } catch {
      setVehicles([]);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numberPlate || !brand || !model) return;

    setIsSubmitting(true);
    try {
      const res = await api.addVehicle({
        numberPlate,
        brand,
        model,
        color,
        type,
        isDefault,
      });

      if (res.success) {
        setVehicles([...vehicles, res.data]);
        setShowAddModal(false);
        setNumberPlate('');
        setBrand('');
        setModel('');
      }
    } catch {
      // Ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await api.deleteVehicle(id);
      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview Hub</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Vehicle Garage
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            My Vehicles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered vehicles receive instant automated boom barrier clearance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Vehicles Grid / Empty State */}
      {vehicles.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Garage is Empty</h3>
            <p className="text-xs text-slate-400 mt-1">
              Add your car, bike, SUV or EV to unlock automated boom barrier clearance and express check-in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Your First Vehicle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vehicles.map((veh) => (
            <div
              key={veh.id}
              className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                    <Car className="w-6 h-6" />
                  </div>
                  {veh.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      Primary Vehicle
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {veh.brand} {veh.model}
                  </h3>
                  <span className="text-xs text-slate-400">{veh.color} • {veh.type}</span>
                </div>

                {/* Number Plate Card Badge */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1 rounded">IND</span>
                    <span className="font-mono font-black text-white text-sm tracking-wider">
                      {veh.numberPlate}
                    </span>
                  </div>
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Automated Entry
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteVehicle(veh.id)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  title="Remove vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-8 max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Vehicle to Garage</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Registration Number Plate</label>
                <input
                  type="text"
                  value={numberPlate}
                  onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. WB 01 AB 1234"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold text-sm outline-none focus:border-emerald-500 tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Honda"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. City ZX"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Obsidian Black"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Vehicle Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="EV">EV</option>
                    <option value="Bike">Bike</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span>Set as primary default vehicle</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? 'Saving...' : 'Add to Garage'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
