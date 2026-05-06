import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Download, RotateCcw, Loader2, Maximize,
    StopCircle, CheckCircle2, MapPin, PackageSearch, Scan
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
    scanOrderApi,
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
    
    // Refs for Scanner Logic
    const scannerRef = useRef(null);
    const inputRef = useRef(null);
    const lastScannedRef = useRef("");

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: "Picked",
        page: 1,
        limit: 10
    });

    // 1. Geolocation Fetch
    const getGeoLocation = useCallback(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                },
                (error) => toast.error("Please enable GPS for accurate tracking")
            );
        }
    }, []);

    useEffect(() => {
        getGeoLocation();
    }, [getGeoLocation]);

    // 2. Auto-focus for USB Handheld Scanners
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // 3. Load Table Data
    const loadScannedOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchTodayScannedOrdersApi({
                date: filters.date,
                status: filters.status,
                page: filters.page,
                limit: filters.limit
            });
            setOrders(res.orders || []);
            setPagination(res.pagination || { page: 1, total_pages: 1 });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    // 4. Unified Scan Process Logic (Camera & USB)
    const handleScanSuccess = async (decodedText) => {
        if (!decodedText || loading) return;

        // Prevent duplicate scans within 1.5 seconds (debouncing)
        if (lastScannedRef.current === decodedText) return;
        lastScannedRef.current = decodedText;

        try {
            toast.loading(`Processing ${decodedText}...`, { id: 'scan-act' });

            // API: Change Order Status
            await scanOrderApi(decodedText);

            // API: Update Location if GPS is on
            if (location.lat) {
                await getOrderPincodeApi(decodedText, location.lat, location.lng);
            }

            toast.success(`Order ${decodedText} Verified`, { id: 'scan-act' });

            if (navigator.vibrate) navigator.vibrate(200);

            loadScannedOrders(); // Refresh table
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid Barcode", { id: 'scan-act' });
        }

        // Reset the "last scanned" lock after a delay
        setTimeout(() => {
            lastScannedRef.current = "";
        }, 1500);
    };

    // 5. Camera Toggle Logic
    const toggleScanner = async () => {
        if (isScanning) {
            if (scannerRef.current) {
                await scannerRef.current.stop().catch(() => { });
                scannerRef.current.clear();
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
                if (!devices || devices.length === 0) throw new Error("No camera found");

                // Prefer back camera on mobile devices
                let cameraId = devices[0].id;
                const backCam = devices.find(d => d.label.toLowerCase().includes("back"));
                if (backCam) cameraId = backCam.id;

                await html5QrCode.start(
                    cameraId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 120 },
                        aspectRatio: 1.777,
                    },
                    (decodedText) => handleScanSuccess(decodedText),
                    () => { } // silent ignore on failed frames
                );
            } catch (err) {
                console.error("Camera error:", err);
                toast.error("Camera failed: " + err.message);
                setIsScanning(false);
            }
        }, 300);
    };

    // Cleanup on page close
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
                scannerRef.current.clear();
            }
        };
    }, []);

    const handleExport = () => {
        if (orders.length === 0) return toast.error("No data to export");
        const headers = ["Order Number", "Status", "Customer", "Date"];
        const csv = [headers, ...orders.map(o => [o.order_number, o.status, o.consignee?.name, o.updated_at])].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Scanned_Report_${filters.date}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-dashboard-bg min-h-screen">
            {/* HIDDEN INPUT FOR USB SCANNERS */}
            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute pointer-events-none top-0 left-0"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleScanSuccess(e.target.value);
                        e.target.value = ""; // Clear for next scan
                    }
                }}
                autoFocus
            />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Scan className="text-primary" /> Speed Scanner
                    </h1>
                    <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">
                        Capture Barcodes via Camera or USB Handheld
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-card-bg border border-border-subtle rounded-lg text-[10px] font-bold">
                        <MapPin size={14} className={location.lat ? "text-green-500" : "text-red-500"} />
                        <span className="text-text-main">
                            {location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "GPS DISABLED"}
                        </span>
                    </div>
                    <Button
                        onClick={toggleScanner}
                        className={`${isScanning ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"} text-black font-bold h-11 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2`}
                    >
                        {isScanning ? <><StopCircle size={20} /> Stop Camera</> : <><Maximize size={20} /> Start Camera</>}
                    </Button>
                </div>
            </div>

            {/* Active Camera UI */}
            {isScanning && (
                <Card className="border-2 border-primary border-dashed bg-black overflow-hidden relative">
                    <CardContent className="p-0 flex flex-col items-center">
                        <div id="reader" className="w-full min-h-[300px] bg-black flex items-center justify-center"></div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="bg-primary/90 text-black px-4 py-1 rounded-full text-xs font-bold animate-pulse">
                                CAMERA SCANNER ACTIVE
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Listing and Filters */}
            <Card className="bg-card-bg border-border-subtle shadow-md overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-4 bg-dashboard-bg/50 border-b border-border-subtle grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Filter Date</label>
                            <input
                                type="date"
                                className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2.5 text-xs text-text-main focus:ring-2 focus:ring-primary outline-none"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Target Status</label>
                            <select
                                className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2.5 text-xs text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="Picked">Picked (In-Scan)</option>
                                <option value="Dispatched">Dispatched (Out-Scan)</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={loadScannedOrders} className="flex-1 bg-white/5 hover:bg-white/10 text-text-main text-xs font-bold h-10 border border-border-subtle">
                                <RotateCcw size={14} className="mr-2" /> Refresh
                            </Button>
                            <Button onClick={handleExport} className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold h-10 border border-primary/20">
                                <Download size={14} className="mr-2" /> Export
                            </Button>
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="overflow-x-auto relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20">
                                <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                        )}
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-dashboard-bg/80 text-text-muted text-[10px] font-black uppercase tracking-tighter border-b border-border-subtle">
                                    <th className="px-6 py-4">Order Details</th>
                                    <th className="px-6 py-4">Consignee</th>
                                    <th className="px-6 py-4">Box Info</th>
                                    <th className="px-6 py-4">Weight</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-primary/5 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-black text-text-main group-hover:text-primary transition-colors">{order.order_number}</div>
                                                <div className="text-[10px] text-text-muted font-bold">{order.order_type} • {order.payment_method}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-text-main">{order.consignee?.name}</div>
                                                <div className="text-[10px] text-text-muted italic">Verified Consignee</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                    {order.packages?.map((pkg, i) => (
                                                        <span key={i} className="text-[9px] bg-dashboard-bg border border-border-subtle px-1.5 py-0.5 rounded text-text-muted">
                                                            {pkg.length_cm}x{pkg.breadth_cm}x{pkg.height_cm}cm
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-black text-text-main">{order.total_weight_kg} <span className="text-[10px] font-normal text-text-muted">KG</span></div>
                                                <div className="text-[10px] text-primary font-bold">{order.total_boxes} Box(es)</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center w-fit gap-1.5 ${order.status === 'Picked' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                    <CheckCircle2 size={12} /> {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] text-text-muted font-mono bg-dashboard-bg/20">
                                                {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <PackageSearch size={64} className="text-text-muted" />
                                                <div className="space-y-1">
                                                    <p className="text-xl font-bold text-text-main">No Scanned Items</p>
                                                    <p className="text-xs uppercase tracking-widest">USB Scanner ready or use Start Camera</p>
                                                </div>
                                            </div>
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
                </CardContent>
            </Card>
        </div>
    );
}