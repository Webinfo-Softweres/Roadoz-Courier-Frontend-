import React, { useState, useEffect } from 'react';
import { Search, X, User, Truck, Loader2 } from 'lucide-react';
import { fetchSearchDriversApi, fetchSearchVehiclesApi } from '../../services/apiCalls';

export default function PickupModal({ isOpen, onClose, onSubmit, selectedCount }) {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [searchDriver, setSearchDriver] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");
  
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [dRes, vRes] = await Promise.all([
        fetchSearchDriversApi(""),
        fetchSearchVehiclesApi("")
      ]);
      setDrivers(dRes || []);
      setVehicles(vRes || []);
    } catch (error) {
      console.error("Load error", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(d => 
    `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchDriver.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v => 
    v.plate_number.toLowerCase().includes(searchVehicle.toLowerCase()) ||
    v.model.toLowerCase().includes(searchVehicle.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedDriver || !selectedVehicle) return alert("Please select both Driver and Vehicle");
    setSubmitting(true);
    await onSubmit({ driver_id: selectedDriver, vehicle_id: selectedVehicle });
    setSubmitting(false);
    setSelectedDriver("");
    setSelectedVehicle("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Assign Pickup</h3>
            <p className="text-sm text-slate-500">{selectedCount} orders selected</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Driver Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-blue" /> Select Driver
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search driver name..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 outline-none"
                value={searchDriver}
                onChange={(e) => setSearchDriver(e.target.value)}
              />
            </div>
            <select 
              size="4"
              className="w-full border border-slate-200 rounded-lg p-1 text-sm focus:ring-0 outline-none overflow-y-auto"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              {filteredDrivers.map(d => (
                <option key={d.id} value={d.id} className="p-2 rounded hover:bg-brand-blue/10">
                  {d.first_name} {d.last_name} ({d.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-red" /> Select Vehicle
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search plate number or model..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-red/20 outline-none"
                value={searchVehicle}
                onChange={(e) => setSearchVehicle(e.target.value)}
              />
            </div>
            <select 
              size="4"
              className="w-full border border-slate-200 rounded-lg p-1 text-sm focus:ring-0 outline-none overflow-y-auto"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              {filteredVehicles.map(v => (
                <option key={v.id} value={v.id} className="p-2 rounded hover:bg-brand-red/10">
                  {v.plate_number} - {v.model} ({v.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-white transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedDriver || !selectedVehicle || submitting}
            className="flex-[2] px-4 py-2.5 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Pickup Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
