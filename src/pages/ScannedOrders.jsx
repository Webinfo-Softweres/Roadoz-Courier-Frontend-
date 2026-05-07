import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    RotateCcw, Loader2, Maximize, StopCircle, 
    CheckCircle2, MapPin, PackageSearch, Scan
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi
} from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";

export default function ScannedOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
    
    const scannerRef = useRef(null);
    const inputRef = useRef(null);
    const lastScannedRef = useRef(""); // To prevent duplicate scans

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: "Picked",
        page: 1,
        limit: 10
    });

    // 1. Fetch Location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("[GPS] Denied:", err.message)
            );
        }
    }, []);

    // 2. Main Scan Handler (Camera & USB)
    const handleScanSuccess = async (decodedText) => {
        // LOG: Check if anything was captured
        console.log(`[SCANNER] Captured Barcode Value: "${decodedText}"`);

        if (!decodedText || loading) {
            console.warn("[SCANNER] Empty value or busy loading. Ignoring.");
            return;
        }

        // Prevent double scanning the same code within 3 seconds
        if (lastScannedRef.current === decodedText) {
            console.log("[SCANNER] Already processed this code recently. Skipping.");
            return;
        }

        lastScannedRef.current = decodedText;
        toast.loading(`Processing Order: ${decodedText}`, { id: 'scan-act' });

        try {
            console.log(`[API] Triggering Status Update for: ${decodedText}`);
            
            // Send captured barcode to API
            const res = await getOrderPincodeApi(decodedText, location.lat, location.lng);
            
            console.log("[API] Scan Response Success:", res);
            toast.success(`Order ${decodedText} Verified`, { id: 'scan-act' });

            if (navigator.vibrate) navigator.vibrate(200);

            // Refresh table
            loadScannedOrders(); 
        } catch (error) {
            console.error("[API] Scan Response Error:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Invalid Barcode", { id: 'scan-act' });
        }

        // Reset debounce lock after a delay
        setTimeout(() => { lastScannedRef.current = ""; }, 3000);
    };

    // 3. Load Table Data
    const loadScannedOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchTodayScannedOrdersApi(filters);
            if (res && res.orders) {
                setOrders(res.orders);
                setPagination(res.pagination || { page: 1, total_pages: 1 });
            }
        } catch (error) {
            console.error("[API] Load Table Error:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    // 4. Camera Toggle logic
    const toggleScanner = async () => {
        if (isScanning) {
            if (scannerRef.current) {
                console.log("[CAMERA] Stopping Scanner...");
                await scannerRef.current.stop().catch(() => {});
                scannerRef.current = null;
            }
            setIsScanning(false);
            return;
        }

        setIsScanning(true);
        console.log("[CAMERA] Starting Scanner...");

        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;
                const devices = await Html5Qrcode.getCameras();
                
                if (!devices || devices.length === 0) {
                    toast.error("No camera found");
                    setIsScanning(false);
                    return;
                }

                // Choose Back Camera
                const backCam = devices.find(d => d.label.toLowerCase().includes("back")) || devices[0];
                console.log("[CAMERA] Using Device:", backCam.label);

                await html5QrCode.start(
                    backCam.id,
                    { 
                        fps: 15, // Higher frame rate for faster scanning
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.777 
                    },
                    (text) => {
                        // LOG: Immediate feedback when camera hits a code
                        console.log("[CAMERA] QR Code Found in Frame:", text);
                        handleScanSuccess(text);
                    },
                    (err) => { /* Silent: Camera searching for code */ }
                );
            } catch (err) {
                console.error("[CAMERA] Startup Failed:", err);
                setIsScanning(false);
            }
        }, 300);
    };

    return (
        <div className="p-4 lg:p-6 space-y-6 bg-dashboard-bg min-h-screen text-text-main">
            {/* HIDDEN INPUT FOR USB SCANNER */}
            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute pointer-events-none"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        console.log("[USB] Enter Key Pressed on Input");
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
                        LAT: {location.lat?.toFixed(4) || "0.00"} | LNG: {location.lng?.toFixed(4) || "0.00"}
                    </div>
                    <Button onClick={toggleScanner} className={isScanning ? "bg-red-500" : "bg-primary text-black"}>
                        {isScanning ? <StopCircle className="mr-2" /> : <Maximize className="mr-2" />}
                        {isScanning ? "Stop Camera" : "Start Camera"}
                    </Button>
                </div>
            </div>

            {isScanning && (
                <div id="reader" className="w-full max-w-xl mx-auto rounded-xl border-2 border-primary bg-black aspect-video overflow-hidden shadow-2xl"></div>
            )}

            {/* Records Table */}
            <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-border-subtle">
                    <input
                        type="date"
                        className="bg-dashboard-bg border border-border-subtle rounded p-2 text-xs"
                        value={filters.date}
                        onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
                    />
                    <select
                        className="bg-dashboard-bg border border-border-subtle rounded p-2 text-xs"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                    >
                        <option value="Picked">Picked (In-Scan)</option>
                        <option value="Dispatched">Dispatched (Out-Scan)</option>
                    </select>
                    <Button onClick={loadScannedOrders} className="bg-white/5 border border-border-subtle text-xs">
                        <RotateCcw size={14} className="mr-2" /> Refresh Table
                    </Button>
                </div>

                <div className="overflow-x-auto min-h-[400px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-primary" size={40} />
                        </div>
                    )}
                    <table className="w-full text-left">
                        <thead className="bg-dashboard-bg/50 text-[10px] uppercase font-bold text-text-muted">
                            <tr>
                                <th className="px-6 py-4">Order Details</th>
                                <th className="px-6 py-4">Consignee</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {orders.length > 0 ? (
                                orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-text-main">{o.order_number}</div>
                                            <div className="text-[10px] text-text-muted">{o.order_type}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium">{o.consignee?.name || "N/A"}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-[4px] text-[10px] font-bold">
                                                {o.status}
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