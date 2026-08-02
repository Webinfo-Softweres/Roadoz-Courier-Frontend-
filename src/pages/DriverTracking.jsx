import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Navigation, Users, Truck, 
  PauseCircle, Plus, Minus, Target, Clock, MapPin, X, Gauge, Loader2, AlertCircle
} from 'lucide-react';

// Leaflet Imports
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// API Import
import { fetchDriverLocationsApi } from "../services/apiCalls"; 

// --- CUSTOM MAP COMPONENTS ---

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center]);
  return null;
}

const createCustomIcon = (online) => {
  const color = online ? "#22c55e" : "#94a3b8"; 
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="flex flex-col items-center">
        <div class="w-8 h-8 rounded-full border-2 border-slate-900 shadow-lg overflow-hidden bg-slate-800 flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <div style="background-color: ${color}" class="p-0.5 rounded shadow-md -mt-1.5 border border-slate-900 text-white">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon></svg>
        </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 38],
  });
};

export default function DriverTracking() {
  const [drivers, setDrivers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.0, 76.3]); // Default fallback center

  // 1. Fetch Tracking Data
  const loadTrackingData = async () => {
    try {
      const data = await fetchDriverLocationsApi();
      // Ensure data is an array
      const driversArray = Array.isArray(data) ? data : [];
      setDrivers(driversArray);
      
      // If a driver was already selected, update their latest data from the new batch
      if (selectedDriver) {
        const updatedSelected = driversArray.find(d => d.driver.id === selectedDriver.driver.id);
        if (updatedSelected) setSelectedDriver(updatedSelected);
      }
    } catch (error) {
      console.error("Failed to fetch driver locations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    const interval = setInterval(loadTrackingData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // 2. Filter Logic (Sidebar List)
  const filteredDriversList = useMemo(() => {
    return drivers.filter(item => {
      const name = `${item.driver?.first_name || ''} ${item.driver?.last_name || ''}`.toLowerCase();
      const phone = (item.driver?.phone || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
    });
  }, [drivers, searchTerm]);

  // 3. Markers Logic (Only drivers WITH location data)
  const driversWithLocation = useMemo(() => {
    return drivers.filter(item => item.location && item.location.lat && item.location.lng);
  }, [drivers]);

  // 4. Stats Calculation
  const stats = {
    total: drivers.length,
    onMap: driversWithLocation.length,
    online: drivers.filter(d => d.driver?.online).length,
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="h-screen bg-[#0B0F1A] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={40} />
        <p className="text-slate-400 animate-pulse">Initializing Real-time Fleet Map...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0B0F1A] overflow-hidden font-sans text-slate-300">
      
      {/* STATS HEADER */}
      <div className="flex gap-3 p-4 overflow-x-auto">
        {[
          { label: "Total Drivers", val: stats.total, icon: Users, color: "blue" },
          { label: "On Live Map", val: stats.onMap, icon: MapPin, color: "green" },
          { label: "Online Now", val: stats.online, icon: Truck, color: "blue" }
        ].map((stat, idx) => (
          <div key={idx} className="flex-1 min-w-[180px] bg-[#161B26] p-3 rounded-xl border border-slate-800/50 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.val}</p>
            </div>
            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 border border-blue-500/20">
              <stat.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 px-4 pb-4 gap-4 overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        <div className="w-[320px] bg-[#111827] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-800">
          <div className="p-4 border-b border-slate-800 bg-slate-900/20">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name or phone..." 
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-700 outline-none focus:ring-1 focus:ring-blue-500/50" 
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredDriversList.length === 0 ? (
               <div className="text-center py-10 text-slate-600 text-xs">No drivers found</div>
            ) : (
              filteredDriversList.map((item) => (
                <div 
                  key={item.driver.id}
                  onClick={() => { 
                    if (item.location) {
                      setSelectedDriver(item); 
                      setMapCenter([item.location.lat, item.location.lng]); 
                    }
                  }}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${selectedDriver?.driver?.id === item.driver.id ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800/40'} ${!item.location ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold border border-slate-700">
                        {item.driver.first_name?.[0] || 'D'}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#111827] rounded-full ${item.driver.online ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold leading-tight ${selectedDriver?.driver?.id === item.driver.id ? 'text-white' : 'text-slate-200'}`}>
                        {item.driver.first_name} {item.driver.last_name}
                      </h4>
                      <p className={`text-[9px] font-bold uppercase tracking-tighter mt-0.5 ${selectedDriver?.driver?.id === item.driver.id ? 'text-blue-100' : 'text-slate-500'}`}>
                        {item.vehicle?.plate_number || "NO VEHICLE"}
                      </p>
                    </div>
                  </div>
                  {item.location ? (
                    <Navigation size={12} className={`rotate-45 ${selectedDriver?.driver?.id === item.driver.id ? 'text-white' : 'text-blue-400'}`} />
                  ) : (
                    <AlertCircle size={12} className="text-slate-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAP AREA */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            className="h-full w-full z-0" 
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            
            <ChangeView center={mapCenter} />

            {/* Render Markers only for valid locations */}
            {driversWithLocation.map(item => (
              <Marker 
                key={item.driver.id} 
                position={[item.location.lat, item.location.lng]} 
                icon={createCustomIcon(item.driver.online)}
                eventHandlers={{ click: () => setSelectedDriver(item) }}
              />
            ))}

            {/* Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <button className="bg-[#111827] p-2 rounded-lg text-white border border-slate-800"><Plus size={18}/></button>
              <button className="bg-[#111827] p-2 rounded-lg text-white border border-slate-800"><Minus size={18}/></button>
            </div>

            {/* Driver Details Card */}
            {selectedDriver && selectedDriver.location && (
              <div className="absolute bottom-6 left-6 w-72 bg-[#161B26] rounded-2xl shadow-2xl p-5 z-[1000] border border-slate-800 animate-in slide-in-from-bottom-5">
                  <button onClick={() => setSelectedDriver(null)} className="absolute top-4 right-4 text-slate-600 hover:text-white"><X size={16}/></button>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-black">
                        {selectedDriver.driver.first_name?.[0] || 'D'}
                      </div>
                      <div>
                          <p className="text-sm font-black text-white">{selectedDriver.driver.first_name} {selectedDriver.driver.last_name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedDriver.vehicle?.plate_number || "Unknown Vehicle"}</p>
                      </div>
                  </div>
                  
                  <div className="space-y-2.5 pt-4 border-t border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><Gauge size={14}/> <span className="text-[10px] font-bold uppercase">Speed</span></div>
                        <span className="text-[11px] font-black text-white">{selectedDriver.location.speed?.toFixed(1) || 0} KM/H</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><Truck size={14}/> <span className="text-[10px] font-bold uppercase">Type</span></div>
                        <span className="text-[11px] font-black text-white uppercase">{selectedDriver.vehicle?.type || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500"><Clock size={14}/> <span className="text-[10px] font-bold uppercase">Updated</span></div>
                        <span className="text-[11px] font-black text-white">{new Date(selectedDriver.location.last_updated).toLocaleTimeString()}</span>
                      </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded-lg transition-colors uppercase tracking-wider">
                    View Full History
                  </button>
              </div>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}