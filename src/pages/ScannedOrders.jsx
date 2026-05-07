import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    RotateCcw, Loader2, Maximize, StopCircle, 
    CheckCircle2, MapPin, PackageSearch, Scan
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi
} from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";

export default function ScannedOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [location, setLocation] = useState({ lat: 0, lng: 0 });
    const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
    
    const scannerRef = useRef(null);
    const inputRef = useRef(null);
    const lastScannedRef = useRef(""); 

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: "Picked",
        page: 1,
        limit: 10
    });

    // 1. Get GPS Location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("[GPS] Denied: using 0,0")
            );
        }
    }, []);

    // 2. Load Table List
    const loadScannedOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchTodayScannedOrdersApi(filters);
            if (res && res.orders) {
                setOrders(res.orders);
                setPagination(res.pagination || { page: 1, total_pages: 1 });
            }
        } catch (error) {
            console.error("[LIST ERROR]", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    // 3. Logic: When a barcode is detected
    const handleScanSuccess = async (decodedText) => {
        const barcode = decodedText.trim();
        if (!barcode || loading || lastScannedRef.current === barcode) return;

        console.log(`[SCANNER] Code Found: ${barcode}`);
        lastScannedRef.current = barcode;
        toast.loading(`Processing ${barcode}...`, { id: 'scan-act' });

        try {
            // STEP 1: Update via POST API
            await getOrderPincodeApi(barcode, location.lat, location.lng);
            
            toast.success(`Verified: ${barcode}`, { id: 'scan-act' });
            if (navigator.vibrate) navigator.vibrate(200);

            // STEP 2: Refresh today's list
            loadScannedOrders(); 
        } catch (error) {
            console.error("[SCAN API ERROR]", error);
            toast.error("Invalid Barcode", { id: 'scan-act' });
        }

        // Reset debounce lock
        setTimeout(() => { lastScannedRef.current = ""; }, 3000);
    };

    // 4. Camera Toggle (Fixing the Rectangle)
    const toggleScanner = async () => {
        if (isScanning) {
            if (scannerRef.current) {
                await scannerRef.current.stop().catch(() => {});
                scannerRef.current = null;
            }
            setIsScanning(false);
            return;
        }

        setIsScanning(true);
        
        // Wait for DOM element to render
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader", {
                    formatsToSupport: [ 
                        Html5QrcodeSupportedFormats.CODE_128, 
                        Html5QrcodeSupportedFormats.CODE_39, 
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.QR_CODE 
                    ]
                });
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 20,
                        // This shows the Rectangle UI and limits scan area
                        qrbox: { width: 350, height: 180 }, 
                        aspectRatio: 1.777778,
                        videoConstraints: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    },
                    (text) => handleScanSuccess(text),
                    () => {} // error callback
                );
            } catch (err) {
                console.error("[CAMERA ERROR]", err);
                toast.error("Could not start camera");
                setIsScanning(false);
            }
        }, 300);
    };

    // USB Scanner Auto-Focus
    useEffect(() => {
        const intv = setInterval(() => {
            if (inputRef.current && !isScanning) inputRef.current.focus();
        }, 1000);
        return () => clearInterval(intv);
    }, [isScanning]);

    return (
        <div className="p-4 lg:p-6 space-y-6 bg-dashboard-bg min-h-screen text-text-main">
            {/* HIDDEN INPUT FOR USB SCANNER */}
            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute pointer-events-none"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleScanSuccess(e.target.value);
                        e.target.value = "";
                    }
                }}
                autoFocus
            />

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Scan className="text-primary" /> Speed Scanner
                </h1>
                <div className="flex items-center gap-4">
                    <div className="hidden md:block bg-card-bg px-3 py-2 border border-border-subtle rounded text-[10px] font-mono">
                        GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                    <Button onClick={toggleScanner} className={isScanning ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90 text-black font-bold"}>
                        {isScanning ? <StopCircle className="mr-2" /> : <Maximize className="mr-2" />}
                        {isScanning ? "Stop Camera" : "Start Camera"}
                    </Button>
                </div>
            </div>

            {isScanning && (
                <div className="max-w-2xl mx-auto">
                    <div className="relative bg-black rounded-2xl border-4 border-primary overflow-hidden shadow-2xl">
                        {/* THE SCANNER ELEMENT */}
                        <div id="reader" className="w-full aspect-video"></div>
                        
                        {/* Visual Rectangular Helper Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-[350px] h-[180px] border-2 border-primary border-dashed rounded-lg shadow-[0_0_0_999px_rgba(0,0,0,0.5)]">
                                <div className="absolute -top-6 left-0 right-0 text-center text-primary text-[10px] font-bold uppercase tracking-widest">
                                    Align Barcode Inside
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Card className="bg-card-bg border-border-subtle shadow-sm">
                <div className="p-4 border-b border-border-subtle grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="date"
                        className="bg-dashboard-bg border border-border-subtle rounded p-2 text-xs text-text-main"
                        value={filters.date}
                        onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
                    />
                    <select
                        className="bg-dashboard-bg border border-border-subtle rounded p-2 text-xs text-text-main"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                    >
                        <option value="Picked">Picked (In-Scan)</option>
                        <option value="Dispatched">Dispatched (Out-Scan)</option>
                    </select>
                    <Button onClick={loadScannedOrders} className="bg-white/5 border border-border-subtle text-xs">
                        <RotateCcw size={14} className="mr-2" /> Refresh Todays List
                    </Button>
                </div>

                <div className="overflow-x-auto min-h-[400px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                            <Loader2 className="animate-spin text-primary" size={40} />
                        </div>
                    )}
                    <table className="w-full text-left">
                        <thead className="bg-dashboard-bg/50 text-[10px] uppercase font-bold text-text-muted">
                            <tr>
                                <th className="px-6 py-4">Order Number</th>
                                <th className="px-6 py-4">Consignee</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {orders.length > 0 ? (
                                orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-text-main text-sm">{o.order_number}</td>
                                        <td className="px-6 py-4 text-xs">{o.consignee?.name || "N/A"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${o.status === 'Picked' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                                <CheckCircle2 size={12} className="inline mr-1"/> {o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-mono text-text-muted text-right">
                                            {new Date(o.updated_at).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center text-text-muted italic">
                                        <PackageSearch className="mx-auto mb-2 opacity-20" size={40} />
                                        No scanned items found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.total_pages}
                    onPageChange={(p) => setFilters({ ...filters, page: p })}
                />
            </Card>
        </div>
    );
}