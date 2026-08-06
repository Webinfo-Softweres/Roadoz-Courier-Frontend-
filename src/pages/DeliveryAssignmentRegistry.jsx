import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Search, Eye, RotateCcw,
    Loader2, Truck, Navigation, X, 
    User, MapPin, Package, Calendar
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { fetchDeliveryAssignmentsApi, fetchDeliveryAssignmentDetailsApi } from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";
import { cn } from "../lib/utils";
import { toast } from "react-hot-toast";

export default function DeliveryAssignmentRegistry() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [previewItem, setPreviewItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            const res = await fetchDeliveryAssignmentsApi({ page, search: searchTerm, limit: 10 });
            setItems(res.items || []);
            setPagination({
                page: page,
                total: res.total,
                pages: Math.ceil(res.total / 10)
            });
        } catch (err) {
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openPreview = async (id) => {
        try {
            const res = await fetchDeliveryAssignmentDetailsApi(id);
            setPreviewItem(res);
        } catch (err) {
            toast.error("Error loading details");
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'assigned': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'out_for_delivery': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'delivered': return 'text-green-500 bg-green-500/10 border-green-500/20';
            default: return 'text-text-muted bg-dashboard-bg border-border-subtle';
        }
    };

    return (
        <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">Delivery Registry</h1>
                    <p className="text-xs text-primary font-medium flex items-center gap-1">
                        <Navigation size={12} /> Last Mile Assignment Management
                    </p>
                </div>
                <Button onClick={() => navigate("/dashboard/delivery/create")} className="bg-primary hover:bg-primary/90 text-black font-bold h-10 px-6 rounded-xl shadow-lg text-xs">
                    <Plus size={18} className="mr-2" /> New Delivery Task
                </Button>
            </div>

            {/* Filters */}
            <Card className="bg-card-bg border-border-subtle rounded-2xl shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Search Order Number, Driver Name or Plate..."
                            className="w-full bg-dashboard-bg border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-xs text-text-main focus:border-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData(1)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => fetchData(1)} className="bg-primary text-black px-8 text-xs font-bold rounded-lg h-10">Search</Button>
                        <button onClick={() => { setSearchTerm(""); fetchData(1); }} className="p-2.5 bg-dashboard-bg border border-border-subtle rounded-lg text-primary hover:bg-primary hover:text-black transition-colors"><RotateCcw size={18} /></button>
                    </div>
                </CardContent>
            </Card>

            {/* Main Table */}
            <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-dashboard-bg/60 border-b border-border-subtle">
                            <tr className="text-text-muted text-[10px] font-black uppercase tracking-[0.15em]">
                                <th className="py-5 px-6 text-left">Assignment Info</th>
                                <th className="py-5 px-6 text-left">Delivery Agent</th>
                                <th className="py-5 px-6 text-left">Destination</th>
                                <th className="py-5 px-6 text-left">Status</th>
                                <th className="py-5 px-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr><td colSpan="5" className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={40} /></td></tr>
                            ) : items.length > 0 ? (
                                items.map((t) => (
                                    <tr key={t.id} className="hover:bg-dashboard-bg/30 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="text-[13px] font-mono text-primary font-bold">{t.order?.order_number || "N/A"}</div>
                                            <div className="text-[10px] text-text-muted mt-1 flex items-center gap-1"><Calendar size={10}/> {new Date(t.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-[14px] font-bold text-text-main">{t.driver?.first_name} {t.driver?.last_name}</div>
                                            <div className="text-[11px] text-text-muted flex items-center gap-1 font-mono uppercase"><Truck size={10} className="text-primary"/> {t.vehicle?.plate_number}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-[13px] font-bold text-text-main">{t.consignee?.name}</div>
                                            <div className="text-[11px] text-text-muted truncate max-w-[200px]">{t.delivery_address}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-tighter", getStatusColor(t.status))}>
                                                {t.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button onClick={() => openPreview(t.id)} className="w-9 h-9 inline-flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary hover:text-black transition-all shadow-sm">
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="py-24 text-center opacity-30 font-black text-xs uppercase tracking-widest">No Delivery Assignments Found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {items.length > 0 && (
                    <div className="p-4 border-t border-border-subtle bg-dashboard-bg/20">
                        <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={(p) => fetchData(p)} />
                    </div>
                )}
            </Card>

            {/* DETAIL MODAL */}
            <AnimatePresence>
                {previewItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-card-bg rounded-3xl w-full max-w-4xl border border-border-subtle overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-dashboard-bg/50">
                                <div>
                                    <h3 className="text-xl font-bold text-text-main flex items-center gap-3"><Package className="text-primary" /> Assignment Details</h3>
                                    <p className="text-[10px] text-text-muted font-bold uppercase mt-1">Ref ID: {previewItem.id}</p>
                                </div>
                                <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: Order & Consignee */}
                                    <div className="space-y-6">
                                        <section className="p-5 bg-dashboard-bg border border-border-subtle rounded-2xl">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Shipment Info</label>
                                            <div className="mt-4 flex justify-between items-end">
                                                <div>
                                                    <p className="text-2xl font-mono font-black text-text-main">{previewItem.order?.order_number}</p>
                                                    <p className="text-xs text-text-muted mt-1">Type: {previewItem.order?.order_type} | Method: {previewItem.order?.payment_method}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-text-muted font-bold uppercase">COD Amount</p>
                                                    <p className="text-lg font-bold text-green-500">₹{previewItem.order?.cod_amount?.toLocaleString() || 0}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="p-5 bg-dashboard-bg border border-border-subtle rounded-2xl">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Customer & Address</label>
                                            <div className="mt-4 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{previewItem.consignee?.name[0]}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-main">{previewItem.consignee?.name}</p>
                                                        <p className="text-xs text-text-muted">{previewItem.consignee?.mobile}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-2 border-t border-border-subtle/50">
                                                    <MapPin size={14} className="text-primary mt-1 shrink-0"/>
                                                    <p className="text-xs text-text-muted leading-relaxed">{previewItem.delivery_address}</p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right: Logistics & Load */}
                                    <div className="space-y-6">
                                        <section className="p-5 bg-dashboard-bg border border-border-subtle rounded-2xl">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Assigned Agent</label>
                                            <div className="mt-4 flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary"><User size={24} /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-main uppercase">{previewItem.driver?.first_name} {previewItem.driver?.last_name}</p>
                                                    <p className="text-[11px] text-text-muted font-mono">{previewItem.vehicle?.plate_number} • {previewItem.vehicle?.model}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="p-5 bg-dashboard-bg border border-border-subtle rounded-2xl">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Package Summary</label>
                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-card-bg rounded-xl border border-border-subtle/50">
                                                    <p className="text-[9px] text-text-muted font-bold uppercase">Total Units</p>
                                                    <p className="text-xl font-black text-text-main">{previewItem.order?.weight_summary?.total_boxes} Pkts</p>
                                                </div>
                                                <div className="p-3 bg-card-bg rounded-xl border border-border-subtle/50">
                                                    <p className="text-[9px] text-text-muted font-bold uppercase">Total Weight</p>
                                                    <p className="text-xl font-black text-text-main">{previewItem.order?.weight_summary?.total_weight_kg} <span className="text-xs">KG</span></p>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="flex gap-3">
                                            <Button className="flex-1 bg-primary text-black font-bold h-12 rounded-xl">Track Location</Button>
                                            <Button variant="outline" className="flex-1 h-12 rounded-xl border-border-subtle">Call Driver</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}