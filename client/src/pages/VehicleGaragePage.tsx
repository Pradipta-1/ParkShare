import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Trash2, CheckCircle2, Shield, ArrowLeft, Plus, X, AlertCircle } from 'lucide-react';
import { Vehicle, VehicleType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const VehicleGaragePage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [numberPlate, setNumberPlate] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [type, setType] = useState<VehicleType>('Car');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const fetchVehicles = async () => {
    try {
      let list: Vehicle[] = [];
      const res = await api.getVehicles();
      if (res.success && Array.isArray(res.data)) {
        list = res.data;
      }
      try {
        const local = JSON.parse(localStorage.getItem('parkshare_custom_vehicles') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          const ids = new Set(list.map((v) => v.id));
          list = [...list, ...local.filter((v: any) => !ids.has(v.id))];
        }
      } catch {}
      setVehicles(list);
    } catch {
      try {
        const local = JSON.parse(localStorage.getItem('parkshare_custom_vehicles') || '[]');
        setVehicles(Array.isArray(local) ? local : []);
      } catch {
        setVehicles([]);
      }
    }
  };

  useEffect(() => {
    fetchVehicles();

    const handleSync = () => {
      fetchVehicles();
    };
    window.addEventListener('parkshare_vehicle_added', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('parkshare_vehicle_added', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numberPlate.trim() || !brand.trim() || !model.trim()) {
      setFormError('Registration number plate, brand, and model are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        numberPlate: numberPlate.trim().toUpperCase(),
        brand: brand.trim(),
        model: model.trim(),
        color: color.trim() || 'Obsidian Black',
        type,
        isDefault: isDefault || vehicles.length === 0,
        userId: user?.id || 'usr_driver_1',
      };

      let newVeh: Vehicle;
      try {
        const res = await api.addVehicle(payload);
        if (res.success && res.data) {
          newVeh = res.data;
        } else {
          throw new Error('Could not add vehicle');
        }
      } catch {
        newVeh = {
          id: `veh_${Date.now()}`,
          ...payload,
        };
      }

      try {
        const stored = JSON.parse(localStorage.getItem('parkshare_custom_vehicles') || '[]');
        const updated = [newVeh, ...stored.filter((v: any) => v.id !== newVeh.id)];
        localStorage.setItem('parkshare_custom_vehicles', JSON.stringify(updated));
      } catch {}

      setVehicles((prev) => [newVeh, ...prev.filter((v) => v.id !== newVeh.id)]);
      setShowAddModal(false);
      setNumberPlate('');
      setBrand('');
      setModel('');
      setColor('');
      setIsDefault(false);

      window.dispatchEvent(new Event('parkshare_vehicle_added'));
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      setFormError(err.message || 'Error adding vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from your garage?')) return;
    try {
      await api.deleteVehicle(id);
    } catch {
      // Continue to local cleanup
    }
    try {
      const stored = JSON.parse(localStorage.getItem('parkshare_custom_vehicles') || '[]');
      localStorage.setItem('parkshare_custom_vehicles', JSON.stringify(stored.filter((v: any) => v.id !== id)));
    } catch {}

    setVehicles((prev) => prev.filter((v) => v.id !== id));
    window.dispatchEvent(new Event('parkshare_vehicle_added'));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group shadow-sm border ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40'
              : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-emerald-500/40'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview Hub</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
            Vehicle Garage
          </span>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            My Vehicles
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Registered vehicles receive instant automated boom barrier clearance and express check-in.
          </p>
        </div>

        {/* Prominent Header Add Vehicle Button */}
        <button
          type="button"
          id="add-vehicle-header-btn"
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 w-full sm:w-auto cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Vehicles Grid / Empty State */}
      {vehicles.length === 0 ? (
        <div className={`p-8 sm:p-14 rounded-3xl border text-center space-y-5 max-w-lg mx-auto my-8 shadow-xl ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-slate-300'
            : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <Car className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Your Garage is Empty
            </h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Registered vehicles will appear here with automated boom barrier clearance and express check-in.
            </p>
          </div>
          <button
            type="button"
            id="add-vehicle-empty-btn"
            onClick={() => {
              setFormError('');
              setShowAddModal(true);
            }}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-xl shadow-emerald-500/30 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Your First Vehicle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vehicles.map((veh) => (
            <div
              key={veh.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-lg ${
                isDark
                  ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                    isDark ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}>
                    <Car className="w-6 h-6" />
                  </div>
                  {veh.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                      Primary Vehicle
                    </span>
                  )}
                </div>

                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {veh.brand} {veh.model}
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{veh.color} • {veh.type}</span>
                </div>

                {/* Number Plate Card Badge */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1 rounded">IND</span>
                    <span className={`font-mono font-black text-sm tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {veh.numberPlate}
                    </span>
                  </div>
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div className={`flex items-center justify-between pt-2 border-t text-xs ${
                isDark ? 'border-slate-800/80' : 'border-slate-100'
              }`}>
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Automated Entry
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteVehicle(veh.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-5 sm:p-8 max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto shadow-2xl ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Vehicle to Garage</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Save vehicle details for automated boom barrier clearance.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className={`text-xs block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Registration Number Plate
                </label>
                <input
                  type="text"
                  value={numberPlate}
                  onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. WB 01 AB 1234"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-sm outline-none focus:border-emerald-500 tracking-wider transition-colors ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Brand / Make
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Honda"
                    required
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-colors ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. City ZX"
                    required
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-colors ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Obsidian Black"
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-colors ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Vehicle Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none cursor-pointer focus:border-emerald-500 transition-colors ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="EV">EV</option>
                    <option value="Bike">Bike</option>
                  </select>
                </div>
              </div>

              <label className={`flex items-center gap-2 text-xs cursor-pointer pt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                />
                <span>Set as primary default vehicle</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
              >
                {isSubmitting ? 'Saving to Garage & Cloud...' : 'Add Vehicle to Garage'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
