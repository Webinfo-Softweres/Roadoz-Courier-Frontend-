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
    const [location, setLocation] = useState({ lat: null, lng: null });
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

    // 1. Fetch Location once on load
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("[GPS] Denied: Location data will be 0,0")
            );
        }
    }, []);

    // 2. Load Table
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

    // 3. The Logic: Scan -> Update API -> Refresh List
    const handleScanSuccess = async (decodedText) => {
        const barcode = decodedText.trim();
        console.log(`[SCANNER] Raw Barcode Captured: "${barcode}"`);

        if (!barcode || loading || lastScannedRef.current === barcode) return;

        lastScannedRef.current = barcode;
        toast.loading(`Validating: ${barcode}`, { id: 'scan-act' });

        try {
            // STEP 1: Update the status to 'Picked' via the Pincode/GPS API
            console.log(`[API] Updating status for ${barcode}...`);
            const res = await getOrderPincodeApi(barcode, location.lat, location.lng);
            
            console.log("[API] Update Response:", res);
            toast.success(`Verified: ${barcode}`, { id: 'scan-act' });

            if (navigator.vibrate) navigator.vibrate(200);

            // STEP 2: Reload the "Today's Listing" to show the item
            loadScannedOrders(); 
        } catch (error) {
            console.error("[API ERROR]", error.response?.data || error.message);
            // If the server says invalid, it's usually because the barcode string is partial or doesn't exist
            toast.error(error.response?.data?.message || "Invalid Barcode Structure", { id: 'scan-act' });
        }

        // Reset lock after 3 seconds to allow re-scanning if needed
        setTimeout(() => { lastScannedRef.current = ""; }, 3000);
    };

    // 4. Camera Setup (Fixed for Laptop and Barcode Shapes)
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
                // Focus on 1D Barcodes + QR
                const html5QrCode = new Html5Qrcode("reader", { 
                    formatsToSupport: [ 
                        Html5QrcodeSupportedFormats.CODE_128, 
                        Html5QrcodeSupportedFormats.CODE_39, 
                        Html5QrcodeSupportedFormats.EAN_13, 
                        Html5QrcodeSupportedFormats.QR_CODE 
                    ] 
                });
                
                scannerRef.current = html5QrCode;
                const devices = await Html5Qrcode.getCameras();
                if (!devices.length) throw new Error("No camera detected");

                const backCam = devices.find(d => d.label.toLowerCase().includes("back")) || devices[0];

                await html5QrCode.start(
                    backCam.id,
                    { 
                        fps: 20, 
                        // WIDE RECTANGLE for barcodes (not a square)
                        qrbox: { width: 350, height: 150 }, 
                        aspectRatio: 1.7777,
                        // Request high resolution for better focus on laptop cams
                        videoConstraints: {
                            facingMode: "environment",
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    },
                    (text) => handleScanSuccess(text),
                    () => {} 
                );
            } catch (err) {
                console.error("[CAMERA ERROR]", err);
                toast.error("Camera error. Use USB Scanner instead.");
                setIsScanning(false);
            }
        }, 300);
    };

    // Keep hidden input focused for USB Handheld scanner
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
                    <Scan className="text-primary" /> Multi-Device Scanner
                </h1>
                <div className="flex items-center gap-4">
                    <div className="hidden md:block bg-card-bg px-3 py-2 border border-border-subtle rounded text-[10px] font-mono">
                        GPS: {location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "WAITING..."}
                    </div>
                    <Button onClick={toggleScanner} className={isScanning ? "bg-red-500" : "bg-primary text-black font-bold"}>
                        {isScanning ? <StopCircle className="mr-2" /> : <Maximize className="mr-2" />}
                        {isScanning ? "Stop Camera" : "Start Camera"}
                    </Button>
                </div>
            </div>

            {isScanning && (
                <div className="relative w-full max-w-2xl mx-auto">
                    <div id="reader" className="w-full bg-black rounded-2xl border-2 border-primary overflow-hidden shadow-2xl aspect-video"></div>
                    <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/50 bg-black/40 py-1">
                        Align the barcode inside the center rectangle
                    </p>
                </div>
            )}

            <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-subtle grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <RotateCcw size={14} className="mr-2" /> Refresh Todays List
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
                                <th className="px-6 py-4">Order Number</th>
                                <th className="px-6 py-4">Consignee</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Last Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {orders.length > 0 ? (
                                orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-text-main text-sm">{o.order_number}</td>
                                        <td className="px-6 py-4 text-xs font-medium">{o.consignee?.name || "N/A"}</td>
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
                                        No Picked orders found for today.
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