import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Truck, Camera, Keyboard, Save, ChevronLeft, 
    Loader2, Trash2, CheckCircle2, MapPin, User, Package, X 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Html5Qrcode } from "html5-qrcode";
import { 
    fetchTripDriversApi, fetchTripVehiclesApi, 
    scanOrderApi, createDeliveryAssignmentApi 
} from "../services/apiCalls";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";

const SearchableSelect = ({ label, options, value, onChange, placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);
    const filtered = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
    const selected = options.find(opt => opt.id === value);

    useEffect(() => {
        const clickOut = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", clickOut);
        return () => document.removeEventListener("mousedown", clickOut);
    }, []);

    return (
        <div className="space-y-1.5 relative" ref={containerRef}>
            <label className="text-[10px] font-bold uppercase text-text-muted ml-1">{label}</label>
            <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main flex justify-between items-center cursor-pointer hover:border-primary transition-all">
                <span className="flex items-center gap-2">
                    {Icon && <Icon size={16} className="text-primary"/>}
                    <span className={cn(!selected && "text-text-muted")}>{selected ? selected.label : placeholder}</span>
                </span>
            </div>
            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-border-subtle bg-dashboard-bg/50">
                        <input autoFocus className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs outline-none" 
                               placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} />
                    </div>
                    <div className="max-h-52 overflow-y-auto custom-scrollbar">
                        {filtered.map(opt => (
                            <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(""); }}
                                 className={cn("px-4 py-3 text-xs text-text-main hover:bg-primary hover:text-black cursor-pointer", value === opt.id && "bg-primary/10 font-bold")}>
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function DeliveryAssignmentForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [masters, setMasters] = useState({ drivers: [], vehicles: [] });
    const [isScanning, setIsScanning] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [formData, setFormData] = useState({ driver_id: "", vehicle_id: "", assignments: [] });
    const html5QrCode = useRef(null);

    useEffect(() => {
        const init = async () => {
            const [d, v] = await Promise.all([fetchTripDriversApi(), fetchTripVehiclesApi()]);
            setMasters({
                drivers: d.map(i => ({ id: i.id, label: `${i.first_name} ${i.last_name} (${i.phone})` })),
                vehicles: v.map(i => ({ id: i.id, label: `${i.plate_number} - ${i.model}` }))
            });
        };
        init();
        navigator.geolocation.getCurrentPosition(pos => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }, []);

    const processBarcode = async (code) => {
        const cleanCode = code?.trim().toUpperCase();
        if (!cleanCode) return;
        if (formData.assignments.find(a => a.order_number === cleanCode)) return toast.error("Already added");

        const tid = toast.loading(`Scanning ${cleanCode}...`);
        try {
            const order = await scanOrderApi(cleanCode);
            setFormData(p => ({ ...p, assignments: [order, ...p.assignments] }));
            toast.success("Order Added", { id: tid });
            setManualCode("");
        } catch (err) { toast.error("Order not found", { id: tid }); }
    };

    const toggleCamera = async () => {
        if (isScanning) {
            if (html5QrCode.current) { await html5QrCode.current.stop(); html5QrCode.current = null; }
            setIsScanning(false);
        } else {
            setIsScanning(true);
            setTimeout(() => {
                html5QrCode.current = new Html5Qrcode("reader-ofd");
                html5QrCode.current.start({ facingMode: "environment" }, { fps: 12, qrbox: 250 }, (text) => processBarcode(text));
            }, 100);
        }
    };

    const handleSave = async () => {
        // VALIDATION
        if (!formData.driver_id || !formData.vehicle_id) return toast.error("Select Driver and Vehicle");
        if (formData.assignments.length === 0) return toast.error("No orders scanned");

        setLoading(true);
        try {
            // FIXED PAYLOAD: 
            // 1. Changed order_ids to order_barcodes
            // 2. Used item.order_number instead of item.id
            // 3. Filtered out any potential nulls
            const payload = {
                driver_id: formData.driver_id,
                vehicle_id: formData.vehicle_id,
                order_barcodes: formData.assignments
                    .map(a => a.order_number)
                    .filter(code => code !== null && code !== undefined),
                lat: location.lat,
                lng: location.lng,
                status: "assigned"
            };
            
            await createDeliveryAssignmentApi(payload);
            toast.success("Delivery Assignments Created");
            navigate("/trip/delivery-bookings");
        } catch (err) {
            toast.error(err.response?.data?.detail?.[0]?.msg || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 p-0 text-text-muted hover:bg-primary hover:text-black">
                        <ChevronLeft />
                    </Button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">New Delivery Assignment</h1>
                        <p className="text-xs text-primary font-medium flex items-center gap-1">
                            <MapPin size={12}/> {location.lat ? "GPS Connected" : "Detecting Location..."}
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-black font-black h-12 px-10 rounded-2xl shadow-xl">
                    {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Confirm Dispatch</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-card-bg border-border-subtle rounded-3xl overflow-visible">
                        <div className="p-5 border-b border-border-subtle bg-dashboard-bg/50">
                            <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2"><Truck size={14} className="text-primary" /> Assignment</h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <SearchableSelect label="Delivery Boy *" placeholder="Select Driver" icon={User} options={masters.drivers} value={formData.driver_id} onChange={val => setFormData({...formData, driver_id: val})} />
                            <SearchableSelect label="Vehicle *" placeholder="Select Vehicle" icon={Truck} options={masters.vehicles} value={formData.vehicle_id} onChange={val => setFormData({...formData, vehicle_id: val})} />
                        </CardContent>
                    </Card>

                    {formData.assignments.length > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                            <p className="text-[10px] font-bold text-primary uppercase">Total Load</p>
                            <p className="text-3xl font-black text-text-main">{formData.assignments.length} <span className="text-xs font-normal text-text-muted">Orders</span></p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={cn("p-5 rounded-2xl border border-dashed transition-all", isScanning ? "border-red-500 bg-red-500/5" : "border-primary/40 bg-primary/5")}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black uppercase text-text-main flex items-center gap-2"><Camera size={16} className="text-primary"/> Scanner</span>
                                <Button size="sm" onClick={toggleCamera} variant={isScanning ? "destructive" : "outline"} className="h-8 text-[10px] rounded-xl border-primary/30 text-primary">
                                    {isScanning ? "Stop" : "Open Cam"}
                                </Button>
                            </div>
                            <div id="reader-ofd" className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner" />
                        </div>

                        <div className="p-5 bg-dashboard-bg/50 rounded-2xl border border-border-subtle">
                            <span className="text-xs font-black uppercase text-text-main flex items-center gap-2 mb-4"><Keyboard size={16} className="text-primary"/> Manual Entry</span>
                            <div className="relative">
                                <input type="text" className="w-full bg-card-bg border border-border-subtle rounded-xl px-5 py-3 text-sm text-primary font-mono font-black focus:border-primary outline-none" 
                                       placeholder="Ex: ORD-001" value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())}
                                       onKeyDown={e => e.key === 'Enter' && processBarcode(manualCode)} />
                                <button onClick={() => processBarcode(manualCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform">
                                    <CheckCircle2 size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <Card className="bg-card-bg border-border-subtle rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
                        <div className="p-5 border-b border-border-subtle bg-dashboard-bg/50">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-main">Scanned Items</h3>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-dashboard-bg/30 text-[9px] uppercase font-black text-text-muted border-b border-border-subtle">
                                    <tr>
                                        <th className="py-4 px-6 text-left">Order #</th>
                                        <th className="py-4 px-6 text-left">Consignee</th>
                                        <th className="py-4 px-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {formData.assignments.length > 0 ? formData.assignments.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-dashboard-bg/30 transition-colors">
                                            <td className="py-4 px-6 font-mono text-primary font-black">{item.order_number}</td>
                                            <td className="py-4 px-6">
                                                <div className="text-[12px] font-bold text-text-main">{item.consignee?.name}</div>
                                                <div className="text-[10px] text-text-muted truncate max-w-[200px]">{item.consignee?.city}</div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => setFormData(p => ({...p, assignments: p.assignments.filter(a => a.order_number !== item.order_number)}))} 
                                                        className="p-2 text-red-500 bg-red-500/5 rounded-lg border border-red-500/10 hover:bg-red-500 hover:text-white">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" className="py-24 text-center opacity-20 font-black text-xs uppercase tracking-widest">No Items Scanned</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}