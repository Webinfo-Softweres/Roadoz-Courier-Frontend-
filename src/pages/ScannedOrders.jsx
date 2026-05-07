import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Download,
    RotateCcw,
    Loader2,
    Maximize,
    StopCircle,
    CheckCircle2,
    MapPin,
    PackageSearch,
    Scan
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
    const [scanLoading, setScanLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const [location, setLocation] = useState({
        lat: null,
        lng: null
    });

    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        total_pages: 1
    });

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split("T")[0],
        status: "Picked",
        page: 1,
        limit: 10
    });

    const scannerRef = useRef(null);
    const inputRef = useRef(null);

    const scanCooldownRef = useRef({});

    /*
    =====================================================
    GEO LOCATION
    =====================================================
    */

    const getGeoLocation = useCallback(() => {

        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {

                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                console.log("GPS:", coords);

                setLocation(coords);
            },
            (error) => {
                console.log(error);
                toast.error("Enable GPS Location");
            },
            {
                enableHighAccuracy: true
            }
        );

    }, []);

    useEffect(() => {
        getGeoLocation();
    }, [getGeoLocation]);

    /*
    =====================================================
    AUTO FOCUS USB SCANNER
    =====================================================
    */

    useEffect(() => {

        const focusInput = () => {
            inputRef.current?.focus();
        };

        focusInput();

        window.addEventListener("click", focusInput);

        return () => {
            window.removeEventListener("click", focusInput);
        };

    }, []);

    /*
    =====================================================
    LOAD ORDERS
    =====================================================
    */

    const loadScannedOrders = useCallback(async () => {

        setLoading(true);

        try {

            const res = await fetchTodayScannedOrdersApi({
                date: filters.date,
                status: filters.status,
                page: filters.page,
                limit: filters.limit
            });

            console.log("Orders:", res);

            setOrders(res.orders || []);

            setPagination(
                res.pagination || {
                    page: 1,
                    total_pages: 1
                }
            );

        } catch (error) {

            console.log(error);

            toast.error("Failed to load orders");

        } finally {

            setLoading(false);

        }

    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    /*
    =====================================================
    BEEP SOUND
    =====================================================
    */

    const playBeep = () => {

        try {

            const audio = new Audio(
                "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
            );

            audio.play();

        } catch (e) {
            console.log(e);
        }
    };

    /*
    =====================================================
    MAIN SCAN PROCESS
    =====================================================
    */

    const handleScanSuccess = async (decodedText) => {

        if (!decodedText) return;

        if (scanLoading) return;

        const orderNumber = decodedText.trim();

        console.log("SCANNED:", orderNumber);

        /*
        DUPLICATE PREVENTION
        */

        const now = Date.now();

        if (
            scanCooldownRef.current[orderNumber] &&
            now - scanCooldownRef.current[orderNumber] < 3000
        ) {
            console.log("Duplicate blocked");
            return;
        }

        scanCooldownRef.current[orderNumber] = now;

        /*
        GPS VALIDATION
        */

        if (!location.lat || !location.lng) {
            toast.error("Waiting for GPS...");
            return;
        }

        setScanLoading(true);

        try {

            toast.loading(`Scanning ${orderNumber}`, {
                id: "scan"
            });

            /*
            API CALL
            */

            const res = await getOrderPincodeApi(
                orderNumber,
                location.lat,
                location.lng
            );

            console.log("SCAN RESPONSE:", res);

            /*
            SUCCESS
            */

            playBeep();

            if (navigator.vibrate) {
                navigator.vibrate(200);
            }

            toast.success(
                res?.message || `Order ${orderNumber} scanned successfully`,
                {
                    id: "scan"
                }
            );

            /*
            REFRESH TABLE
            */

            await loadScannedOrders();

            /*
            AUTO STOP CAMERA
            */

            if (isScanning && scannerRef.current) {

                try {

                    await scannerRef.current.stop();
                    await scannerRef.current.clear();

                    scannerRef.current = null;

                    setIsScanning(false);

                } catch (e) {
                    console.log(e);
                }
            }

        } catch (error) {

            console.log(error);

            toast.error(
                error?.response?.data?.message ||
                "Invalid Barcode",
                {
                    id: "scan"
                }
            );

        } finally {

            setScanLoading(false);

            if (inputRef.current) {
                inputRef.current.value = "";
                inputRef.current.focus();
            }

        }
    };

    /*
    =====================================================
    CAMERA TOGGLE
    =====================================================
    */

    const toggleScanner = async () => {

        /*
        STOP CAMERA
        */

        if (isScanning) {

            try {

                if (scannerRef.current) {

                    await scannerRef.current.stop();
                    await scannerRef.current.clear();

                    scannerRef.current = null;
                }

            } catch (e) {
                console.log(e);
            }

            setIsScanning(false);

            return;
        }

        /*
        START CAMERA
        */

        setIsScanning(true);

        setTimeout(async () => {

            try {

                const html5QrCode = new Html5Qrcode("reader");

                scannerRef.current = html5QrCode;

                const devices = await Html5Qrcode.getCameras();

                if (!devices.length) {
                    throw new Error("No Camera Found");
                }

                /*
                USE LAST CAMERA (BACK CAMERA)
                */

                const cameraId = devices[devices.length - 1].id;

                await html5QrCode.start(
                    cameraId,
                    {
                        fps: 25,
                        qrbox: {
                            width: 300,
                            height: 180
                        },
                        aspectRatio: 1.777
                    },
                    (decodedText) => {

                        console.log("CAMERA RESULT:", decodedText);

                        handleScanSuccess(decodedText);

                    },
                    () => { }
                );

                console.log("Camera Started");

            } catch (error) {

                console.log(error);

                toast.error(error.message);

                setIsScanning(false);
            }

        }, 300);
    };

    /*
    =====================================================
    CLEANUP
    =====================================================
    */

    useEffect(() => {

        return () => {

            if (scannerRef.current) {

                scannerRef.current
                    .stop()
                    .then(() => scannerRef.current.clear())
                    .catch(() => { });
            }
        };

    }, []);

    /*
    =====================================================
    EXPORT CSV
    =====================================================
    */

    const handleExport = () => {

        if (!orders.length) {
            toast.error("No Data");
            return;
        }

        const headers = [
            "Order Number",
            "Status",
            "Customer",
            "Date"
        ];

        const rows = orders.map((o) => [
            o.order_number,
            o.status,
            o.consignee?.name,
            o.updated_at
        ]);

        const csv = [headers, ...rows]
            .map((r) => r.join(","))
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv"
        });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = `Scanned_Report_${filters.date}.csv`;

        a.click();
    };

    /*
    =====================================================
    STATUS COLORS
    =====================================================
    */

    const statusStyles = {
        Picked: "bg-blue-500/10 text-blue-500",
        Dispatched: "bg-yellow-500/10 text-yellow-500",
        Delivered: "bg-green-500/10 text-green-500",
        Cancelled: "bg-red-500/10 text-red-500"
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-dashboard-bg min-h-screen">

            {/* USB SCANNER INPUT */}

            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute pointer-events-none"
                autoFocus
                onKeyDown={(e) => {

                    if (e.key === "Enter") {

                        handleScanSuccess(e.target.value);

                        e.target.value = "";
                    }
                }}
            />

            {/* HEADER */}

            <div className="flex justify-between items-center">

                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Scan className="text-primary" />
                        Speed Scanner
                    </h1>

                    <p className="text-xs uppercase text-text-muted">
                        Camera + USB Scanner
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    <div className="px-3 py-2 rounded-lg border text-xs">

                        <div className="flex items-center gap-2">

                            <MapPin
                                size={14}
                                className={
                                    location.lat
                                        ? "text-green-500"
                                        : "text-red-500"
                                }
                            />

                            <span>
                                {location.lat
                                    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                                    : "GPS WAITING"}
                            </span>

                        </div>
                    </div>

                    <Button
                        onClick={toggleScanner}
                        className={
                            isScanning
                                ? "bg-red-500"
                                : "bg-primary text-black"
                        }
                    >
                        {isScanning ? (
                            <>
                                <StopCircle size={18} />
                                Stop Camera
                            </>
                        ) : (
                            <>
                                <Maximize size={18} />
                                Start Camera
                            </>
                        )}
                    </Button>

                </div>

            </div>

            {/* CAMERA */}

            {isScanning && (

                <Card className="border-2 border-primary border-dashed bg-black">

                    <CardContent className="p-0">

                        <div
                            id="reader"
                            className="w-full min-h-[350px]"
                        />

                    </CardContent>

                </Card>
            )}

            {/* TABLE */}

            <Card>

                <CardContent className="p-0">

                    <div className="p-4 border-b flex gap-3">

                        <Button onClick={loadScannedOrders}>
                            <RotateCcw size={14} />
                            Refresh
                        </Button>

                        <Button onClick={handleExport}>
                            <Download size={14} />
                            Export
                        </Button>

                    </div>

                    <div className="overflow-x-auto relative min-h-[400px]">

                        {(loading || scanLoading) && (

                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">

                                <Loader2
                                    className="animate-spin text-primary"
                                    size={40}
                                />

                            </div>
                        )}

                        <table className="w-full">

                            <thead>

                                <tr className="border-b text-xs uppercase">

                                    <th className="px-6 py-4 text-left">
                                        Order
                                    </th>

                                    <th className="px-6 py-4 text-left">
                                        Customer
                                    </th>

                                    <th className="px-6 py-4 text-left">
                                        Weight
                                    </th>

                                    <th className="px-6 py-4 text-left">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-left">
                                        Time
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {orders.length ? (

                                    orders.map((order) => (

                                        <tr
                                            key={order.id}
                                            className="border-b hover:bg-primary/5"
                                        >

                                            <td className="px-6 py-4">

                                                <div className="font-bold">
                                                    {order.order_number}
                                                </div>

                                                <div className="text-xs text-text-muted">
                                                    {order.order_type}
                                                </div>

                                            </td>

                                            <td className="px-6 py-4">

                                                {order.consignee?.name}

                                            </td>

                                            <td className="px-6 py-4">

                                                {order.total_weight_kg} KG

                                            </td>

                                            <td className="px-6 py-4">

                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyles[order.status]}`}
                                                >
                                                    {order.status}
                                                </span>

                                            </td>

                                            <td className="px-6 py-4 text-xs">

                                                {new Date(
                                                    order.updated_at
                                                ).toLocaleTimeString()}

                                            </td>

                                        </tr>

                                    ))

                                ) : (

                                    <tr>

                                        <td
                                            colSpan={5}
                                            className="text-center py-20"
                                        >

                                            <div className="flex flex-col items-center gap-3">

                                                <PackageSearch size={50} />

                                                <p>No scanned orders</p>

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
                        onPageChange={(p) =>
                            setFilters({
                                ...filters,
                                page: p
                            })
                        }
                    />

                </CardContent>

            </Card>

        </div>
    );
}