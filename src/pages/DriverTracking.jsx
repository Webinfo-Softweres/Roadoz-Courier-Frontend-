import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Navigation, Users, Truck, 
  Plus, Minus, MapPin, X, Gauge, Loader2, AlertCircle, Clock
} from 'lucide-react';

// Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// API Import
import { fetchDriverLocationsApi } from "../services/apiCalls"; 

// --- MAP UTILITY COMPONENTS ---

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      // use flyTo for a smooth "tracking" animation, or setView for instant update
      map.flyTo(center, map.getZoom(), {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, map]);
  return null;
}

const createCustomIcon = (online) => {
  const color = online ? "#22c55e" : "#ef4444";
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="flex flex-col items-center">
        <div class="w-9 h-9 rounded-full border-2 border-slate-900 shadow-lg overflow-hidden bg-slate-800 flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="white" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <div style="background-color: ${color}" class="p-0.5 rounded shadow-md -mt-2 border border-slate-900 text-white">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon></svg>
        </div>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    popupAnchor: [0, -35]
  });
};

export default function DriverTracking() {
  const [drivers, setDrivers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(""); 
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapCenter, setMapCenter] = useState([10.8505, 76.2711]); 

  // 1. REVERSE GEOCODING
  const fetchAddress = async (lat, lng) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setCurrentAddress(data.display_name || "Address not found");
    } catch (error) {
      setCurrentAddress("Error fetching address");
    } finally {
      setLoadingAddress(false);
    }
  };

  // 2. Initial Setup: User Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => console.warn("Location blocked")
      );
    }
  }, []);

  // 3. API Polling and Auto-Sync
  const loadTrackingData = async () => {
    try {
      const data = await fetchDriverLocationsApi();
      const driversArray = Array.isArray(data) ? data : [];
      setDrivers(driversArray);
      
      // CRITICAL FIX: If a driver is selected, update their reference and move the map
      if (selectedDriver) {
        const updated = driversArray.find(d => d.driver.id === selectedDriver.driver.id);
        if (updated && updated.location?.lat) {
          setSelectedDriver(updated);
          // This ensures the map "follows" the vehicle every 10s
          setMapCenter([updated.location.lat, updated.location.lng]);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    const interval = setInterval(loadTrackingData, 10000);
    return () => clearInterval(interval);
  }, [selectedDriver?.driver?.id]); // Re-subscribe if selection changes

  // 4. Trigger Address Fetch only when the ID changes or movement is significant
  useEffect(() => {
    if (selectedDriver?.location?.lat) {
      fetchAddress(selectedDriver.location.lat, selectedDriver.location.lng);
    } else {
      setCurrentAddress("");
    }
  }, [selectedDriver?.driver?.id, selectedDriver?.location?.lat]); 

  const filteredDrivers = useMemo(() => {
    return drivers.filter(item => {
      const fullName = `${item.driver?.first_name} ${item.driver?.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [drivers, searchTerm]);

  if (loading && drivers.length === 0) {
    return (
      <div className="h-screen bg-[#0B0F1A] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={40} />
        <p className="text-slate-400 animate-pulse">Establishing GPS connection...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0B0F1A] overflow-hidden font-sans text-slate-300">
      
      {/* STATS HEADER */}
      <div className="flex gap-4 p-4">
        {[
            { label: "Active Drivers", val: drivers.length, icon: Users, color: "blue" },
            { label: "Live GPS", val: drivers.filter(d => d.location?.lat).length, icon: MapPin, color: "green" }
        ].map((s, i) => (
            <div key={i} className="flex-1 bg-[#161B26] p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{s.label}</p>
                    <p className="text-2xl font-black text-white">{s.val}</p>
                </div>
                <s.icon className={s.color === 'blue' ? 'text-blue-500' : 'text-green-500'} size={24} />
            </div>
        ))}
      </div>

      <div className="flex flex-1 px-4 pb-4 gap-4 overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="w-[320px] bg-[#111827] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-800">
          <div className="p-4 border-b border-slate-800">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text" value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search active drivers..." 
                  className="w-full bg-[#0B0F1A] border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500" 
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredDrivers.map((item) => (
              <div 
                key={item.driver.id}
                onClick={() => { 
                  if (item.location?.lat) {
                    setSelectedDriver(item); 
                    setMapCenter([item.location.lat, item.location.lng]); 
                  }
                }}
                className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${selectedDriver?.driver?.id === item.driver.id ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800/40'} ${!item.location?.lat ? 'opacity-30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border uppercase ${selectedDriver?.driver?.id === item.driver.id ? 'bg-blue-500 border-blue-400' : 'bg-slate-800 border-slate-700'}`}>
                    {item.driver.first_name?.[0]}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${selectedDriver?.driver?.id === item.driver.id ? 'text-white' : 'text-slate-200'}`}>{item.driver.first_name} {item.driver.last_name}</h4>
                    <p className={`text-[10px] font-bold uppercase ${selectedDriver?.driver?.id === item.driver.id ? 'text-blue-100' : 'text-slate-500'}`}>{item.vehicle?.plate_number || "No Plate"}</p>
                  </div>
                </div>
                {item.location?.lat && <Navigation size={12} className={`rotate-45 ${selectedDriver?.driver?.id === item.driver.id ? 'text-white' : 'text-blue-400'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* MAP */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0F172A]">
          <MapContainer center={mapCenter} zoom={15} className="h-full w-full z-0" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />
            
            <ChangeView center={mapCenter} />

            {drivers.filter(d => d.location?.lat).map(item => (
              <Marker 
                key={item.driver.id} 
                position={[item.location.lat, item.location.lng]} 
                icon={createCustomIcon(item.driver.online)}
                eventHandlers={{
                    click: () => {
                        setSelectedDriver(item);
                        setMapCenter([item.location.lat, item.location.lng]);
                    }
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[180px]">
                    <h3 className="font-bold text-slate-900 text-sm">{item.driver.first_name} {item.driver.last_name}</h3>
                    <p className="text-[10px] text-blue-600 font-black mb-2">{item.vehicle?.plate_number}</p>
                    <div className="flex justify-between text-[10px] bg-slate-100 p-1.5 rounded">
                        <span className="text-slate-500 font-bold uppercase">Live Speed</span>
                        <span className="text-slate-900 font-black">{item.location.speed?.toFixed(1) || 0} KM/H</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* FLOATING ADDRESS CARD */}
            {selectedDriver && (
              <div className="absolute bottom-6 left-6 w-80 bg-[#161B26] rounded-2xl shadow-2xl p-5 z-[1000] border border-slate-800 animate-in slide-in-from-bottom-4 transition-all">
                  <button onClick={() => setSelectedDriver(null)} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors"><X size={16}/></button>
                  
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-black uppercase shadow-inner">
                        {selectedDriver.driver.first_name?.[0]}
                      </div>
                      <div>
                          <p className="text-sm font-black text-white">{selectedDriver.driver.first_name} {selectedDriver.driver.last_name}</p>
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${selectedDriver.driver.online ? 'bg-green-500' : 'bg-red-500'}`}></span>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedDriver.vehicle?.plate_number}</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-[#0B0F1A] p-3 rounded-xl border border-slate-800/50 mb-4">
                     <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                        <MapPin size={12} className="text-blue-500"/>
                        <span className="text-[9px] font-bold uppercase tracking-tighter">Current Location</span>
                     </div>
                     {loadingAddress ? (
                         <div className="flex items-center gap-2 text-blue-400">
                             <Loader2 size={10} className="animate-spin" />
                             <span className="text-[10px]">Updating address...</span>
                         </div>
                     ) : (
                        <p className="text-[11px] leading-relaxed text-slate-200 font-medium italic">
                            {currentAddress || "Locating..."}
                        </p>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0B0F1A]/50 p-2 rounded-lg border border-slate-800/30">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Speed</p>
                        <p className="text-xs font-black text-blue-400">{selectedDriver.location.speed?.toFixed(1) || 0} <span className="text-[8px]">km/h</span></p>
                      </div>
                      <div className="bg-[#0B0F1A]/50 p-2 rounded-lg border border-slate-800/30">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Heading</p>
                        <p className="text-xs font-black text-white">{selectedDriver.location.heading || 0}°</p>
                      </div>
                  </div>

                  <p className="mt-4 text-[9px] text-center text-slate-600 font-bold uppercase flex items-center justify-center gap-1">
                    <Clock size={8}/> Last Updated: {new Date(selectedDriver.location.last_updated).toLocaleTimeString()}
                  </p>
              </div>
            )}
          </MapContainer>
        </div>
      </div>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper { background: #ffffff; border-radius: 12px; padding: 4px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4); }
        .custom-popup .leaflet-popup-tip { background: #ffffff; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .leaflet-container { background: #0F172A !important; }
      `}</style>
    </div>
  );
}