import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Download, RotateCcw, Loader2, Maximize,
    StopCircle, CheckCircle2, MapPin, PackageSearch, Scan
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
    const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 });
    
    const scannerRef = useRef(null);
    const inputRef = useRef(null);
    const lastScannedRef = useRef("");

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: "Picked",
        page: 1,
        limit: 10
    });

    // 1. GPS Handler
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("GPS access denied")
            );
        }
    }, []);

    // 2. Load Table (With Safety Checks)
    const loadScannedOrders = useCallback(async () => {
        setLoading(true);
        try {
            console.log("[DEBUG] Fetching with Date Body:", filters.date);
            const res = await fetchTodayScannedOrdersApi(filters);
            
            // Log the full response to see what's actually coming from the server
            console.log("[DEBUG] Full API Response:", res);

            // Safety check: only update if res is valid and has orders
            if (res && res.orders) {
                setOrders(res.orders);
                setPagination(res.pagination || { page: 1, total_pages: 1 });
            } else {
                console.warn("[DEBUG] Response received but 'orders' field is missing:", res);
                setOrders([]);
            }
        } catch (error) {
            console.error("[DEBUG] Load Error:", error.response?.data || error.message);
            toast.error("Failed to load records");
            setOrders([]); // Clear table on error
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    // 3. Scan Handler
    const handleScanSuccess = async (decodedText) => {
        if (!decodedText || loading || lastScannedRef.current === decodedText) return;

        lastScannedRef.current = decodedText;
        toast.loading(`Processing ${decodedText}...`, { id: 'scan-act' });

        try {
            const res = await getOrderPincodeApi(decodedText, location.lat, location.lng);
            console.log("[DEBUG] Scan Success:", res);
            
            toast.success(`Order ${decodedText} Verified`, { id: 'scan-act' });
            if (navigator.vibrate) navigator.vibrate(200);

            loadScannedOrders(); // Refresh table
        } catch (error) {
            console.error("[DEBUG] Scan API Error:", error);
            toast.error(error.response?.data?.message || "Invalid Barcode", { id: 'scan-act' });
        }

        setTimeout(() => { lastScannedRef.current = ""; }, 2000);
    };

    // 4. Camera Logic
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
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;
                const devices = await Html5Qrcode.getCameras();
                const backCam = devices.find(d => d.label.toLowerCase().includes("back")) || devices[0];

                await html5QrCode.start(
                    backCam.id,
                    { fps: 10, qrbox: { width: 250, height: 150 } },
                    (text) => handleScanSuccess(text),
                    () => {}
                );
            } catch (err) {
                console.error("[DEBUG] Camera Error:", err);
                setIsScanning(false);
            }
        }, 300);
    };

    // USB Scanner Auto-focus
    useEffect(() => {
        const interval = setInterval(() => {
            if (inputRef.current && !isScanning) inputRef.current.focus();
        }, 1500);
        return () => clearInterval(interval);
    }, [isScanning]);

    return (
        <div className="p-4 lg:p-6 space-y-6 bg-dashboard-bg min-h-screen text-text-main">
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
                        GPS: {location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "OFF"}
                    </div>
                    <Button onClick={toggleScanner} className={isScanning ? "bg-red-500" : "bg-primary text-black"}>
                        {isScanning ? <StopCircle className="mr-2" /> : <Maximize className="mr-2" />}
                        {isScanning ? "Stop Camera" : "Start Camera"}
                    </Button>
                </div>
            </div>

            {isScanning && (
                <div id="reader" className="w-full max-w-xl mx-auto aspect-video bg-black rounded-xl border-2 border-primary overflow-hidden shadow-2xl"></div>
            )}

            <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-subtle grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-muted">SCAN DATE</label>
                        <input
                            type="date"
                            className="w-full bg-dashboard-bg border border-border-subtle rounded p-2 text-xs"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-muted">TARGET STATUS</label>
                        <select
                            className="w-full bg-dashboard-bg border border-border-subtle rounded p-2 text-xs"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        >
                            <option value="Picked">Picked (In-Scan)</option>
                            <option value="Dispatched">Dispatched (Out-Scan)</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button onClick={loadScannedOrders} className="w-full bg-white/5 border border-border-subtle text-xs">
                            <RotateCcw size={14} className="mr-2" /> Refresh
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-primary" size={40} />
                        </div>
                    )}
                    <table className="w-full text-left">
                        <thead className="bg-dashboard-bg/50 text-[10px] uppercase text-text-muted font-bold">
                            <tr>
                                <th className="px-6 py-4">Order Details</th>
                                <th className="px-6 py-4">Consignee</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {orders && orders.length > 0 ? (
                                orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-text-main">{o.order_number}</div>
                                            <div className="text-[10px] text-text-muted uppercase">{o.order_type} • {o.payment_method}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">{o.consignee?.name || "N/A"}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-[4px] text-[10px] font-bold">
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-mono text-text-muted">
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