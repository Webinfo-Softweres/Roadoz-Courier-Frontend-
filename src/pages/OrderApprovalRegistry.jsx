import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, XCircle, Loader2, Package, MapPin, Truck, X, 
  ClipboardCheck, RefreshCcw, Search, History, ListFilter,
  CheckSquare, Square, User, Car, Info, ChevronRight, Hash,
  FileDown, ChevronLeft, Boxes
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { swalConfirm, swalSuccess, swalError } from "../lib/swal";
import { 
  fetchOrderApprovalDetailsApi, 
  rejectOrderActionApi,
  fetchSearchDriversApi, 
  fetchSearchVehiclesApi,
  createPickupAssignmentApi,
  fetchPickupAssignmentsApi,
  fetchPendingOrdersApi
} from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";
import { cn } from "../lib/utils";

export default function OrderApprovalRegistry() {
  // Data State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination State
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Tab & Search State
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "history"
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Logistics Assignment State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selection, setSelection] = useState({ driver_id: "", vehicle_id: "" });
  const [modalSearch, setModalSearch] = useState({ driver: "", vehicle: "" });
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [previewOrder, setPreviewOrder] = useState(null);
  const [boxPage, setBoxPage] = useState(1);
  const BOXES_PER_PAGE = 3;

  // --- 1. Data Fetching ---
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
        const params = { page, limit, search: searchTerm || undefined };
        let res;
        
        if (activeTab === "pending") {
            res = await fetchPendingOrdersApi(params);
        } else {
            res = await fetchPickupAssignmentsApi(params);
        }

        setItems(res.items || []);
        setTotalItems(res.total || 0);
        setCurrentPage(page);
        setSelectedIds([]); 
    } catch (err) {
        swalError("Error", "Failed to fetch order data");
    } finally {
        setLoading(false);
    }
  }, [activeTab, searchTerm, limit]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // --- 2. Live Search Logistics (Driver/Vehicle) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        if (isAssignModalOpen) {
            const dRes = await fetchSearchDriversApi(modalSearch.driver);
            setDrivers(dRes || []);
        }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [modalSearch.driver, isAssignModalOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        if (isAssignModalOpen) {
            const vRes = await fetchSearchVehiclesApi(modalSearch.vehicle);
            setVehicles(vRes || []);
        }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [modalSearch.vehicle, isAssignModalOpen]);

  // --- 3. Export Logic ---
  const handleExport = () => {
    if (items.length === 0) return swalError("Empty", "No data to export");
    const headers = ["Order No", "Type", "Consignee", "Origin", "Destination", "Amount"];
    const rows = items.map(item => {
        const o = activeTab === "history" ? item.order : item;
        return [
            o.order_number,
            o.order_type,
            o.consignee?.name,
            o.pickup_address?.city,
            o.consignee?.city,
            o.grand_total
        ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `dispatch_${activeTab}.csv`);
    link.click();
  };

  // --- 4. Selection Handlers ---
  const handleSelectAll = () => {
    if (selectedIds.length === items.length) setSelectedIds([]);
    else setSelectedIds(items.map(item => item.id));
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // --- 5. Bulk Assignment Submission ---
  const handleBulkAssign = async () => {
    if (!selection.driver_id || !selection.vehicle_id) {
      return swalError("Required", "Please select Driver and Vehicle");
    }
    setSubmitting(true);
    try {
      // Find selected items to extract barcodes
      const selectedItems = items.filter(item => selectedIds.includes(item.id));
      const orderBarcodes = selectedItems.map(item => 
        activeTab === "history" ? item.order.order_number : item.order_number
      );

      const payload = {
        order_ids: selectedIds,
        order_barcodes: orderBarcodes,
        driver_id: selection.driver_id,
        vehicle_id: selection.vehicle_id
      };
      
      await createPickupAssignmentApi(payload);
      swalSuccess("Success", `${selectedIds.length} orders assigned.`);
      setIsAssignModalOpen(false);
      setSelection({ driver_id: "", vehicle_id: "" });
      fetchData(1);
    } catch (err) {
      swalError("Error", "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id) => {
    const confirmed = await swalConfirm("Reject Order?", "Move to rejected status?");
    if (confirmed) {
      try {
        await rejectOrderActionApi(id);
        swalSuccess("Rejected", "Order updated.");
        fetchData(currentPage);
      } catch (err) {
        swalError("Error", "Rejection failed");
      }
    }
  };

  const openDetails = async (id) => {
    try {
      const res = await fetchOrderApprovalDetailsApi(id);
      setPreviewOrder(res);
      setBoxPage(1);
    } catch (err) {
      swalError("Error", "Could not load details");
    }
  };

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">Logistics Control</h1>
          <p className="text-xs text-primary font-medium flex items-center gap-1"><ClipboardCheck size={12}/> Booking Verification & Dispatch</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="bg-card-bg border-border-subtle text-text-main hover:bg-orange-500 hover:text-white font-bold h-10 px-4 rounded-xl">
                <FileDown size={14} className="mr-2" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchData(1)} className="bg-card-bg border-border-subtle text-text-main hover:bg-primary hover:text-black font-bold h-10 px-4 rounded-xl">
                <RefreshCcw size={14} className="mr-2" /> Refresh
            </Button>
            <AnimatePresence>
                {selectedIds.length > 0 && activeTab === 'pending' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <Button onClick={() => setIsAssignModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-black h-10 px-6 rounded-xl shadow-lg flex items-center gap-2">
                            <Truck size={16}/> Assign ({selectedIds.length})
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-dashboard-bg border border-border-subtle rounded-2xl w-full sm:w-fit">
        <button onClick={() => setActiveTab("pending")} className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === "pending" ? "bg-primary text-black shadow-md" : "text-text-muted hover:text-text-main")}>
          <ListFilter size={16}/> Pending Pickup
        </button>
        <button onClick={() => setActiveTab("history")} className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === "history" ? "bg-primary text-black shadow-md" : "text-text-muted hover:text-text-main")}>
          <History size={16}/> Assigned List
        </button>
      </div>

      {/* Search Bar */}
      <Card className="bg-card-bg border-border-subtle rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input type="text" placeholder="Search by Order No or Consignee..." className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-main focus:border-primary outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData(1)}/>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-dashboard-bg/60 border-b border-border-subtle">
                <tr className="text-text-muted text-[10px] font-black uppercase tracking-[0.15em]">
                  <th className="py-5 px-6 text-left w-10">
                    <button onClick={handleSelectAll} className="text-primary hover:scale-110 transition-transform">
                        {selectedIds.length === items?.length && items.length > 0 ? <CheckSquare size={20}/> : <Square size={20}/>}
                    </button>
                  </th>
                  <th className="py-5 px-6 text-left">Order Information</th>
                  <th className="py-5 px-6 text-left">Consignee</th>
                  <th className="py-5 px-6 text-left">Location Route</th>
                  <th className="py-5 px-6 text-left">{activeTab === "pending" ? "Summary" : "Logistics"}</th>
                  <th className="py-5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr><td colSpan="6" className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={40} /></td></tr>
                ) : items?.length > 0 ? (
                  items.map((item) => {
                    const orderData = activeTab === "history" ? item.order : item;
                    return (
                        <tr key={item.id} className={cn("hover:bg-dashboard-bg/30 transition-colors group", selectedIds.includes(item.id) && "bg-primary/5")}>
                            <td className="py-4 px-6">
                                <button onClick={() => handleSelectRow(item.id)} className={cn("transition-all", selectedIds.includes(item.id) ? "text-primary" : "text-text-muted opacity-40 group-hover:opacity-100")}>
                                    {selectedIds.includes(item.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                                </button>
                            </td>
                            <td className="py-4 px-6">
                                <div className="text-[13px] font-mono text-primary font-bold">{orderData?.order_number}</div>
                                <div className="text-[10px] text-text-muted uppercase font-bold">{orderData?.order_type}</div>
                            </td>
                            <td className="py-4 px-6">
                                <div className="text-[14px] font-bold text-text-main">{orderData?.consignee?.name}</div>
                                <div className="text-[11px] text-text-muted">{orderData?.consignee?.mobile}</div>
                            </td>
                            <td className="py-4 px-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[11px] text-text-main font-medium"><MapPin size={12} className="text-orange-500"/> {orderData?.pickup_address?.city}</div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-text-main font-medium"><ChevronRight size={12} className="text-text-muted"/> {orderData?.consignee?.city}</div>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                {activeTab === "pending" ? (
                                    <>
                                        <div className="text-[14px] font-bold text-text-main">₹{orderData?.grand_total?.toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-green-500 uppercase">{orderData?.weight_summary?.applicable_weight_kg} KG</div>
                                    </>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold"><User size={12}/> {item.driver?.first_name}</div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold"><Car size={12}/> {item.vehicle?.plate_number}</div>
                                    </div>
                                )}
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex justify-center items-center gap-2">
                                    <button onClick={() => openDetails(orderData.id)} className="w-9 h-9 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary hover:text-black transition-all"><Eye size={16} /></button>
                                    {activeTab === "pending" && (
                                        <button onClick={() => handleReject(item.id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"><XCircle size={16} /></button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan="6" className="py-24 text-center opacity-30"><Package size={48} className="mx-auto mb-2"/><p>No Records Found</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
          {items?.length > 0 && (
            <div className="p-4 border-t border-border-subtle">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => fetchData(p)} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* LOGISTICS ASSIGNMENT MODAL */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card-bg rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border-subtle">
              <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/50">
                <div><h3 className="font-bold text-text-main text-lg uppercase tracking-tighter">Assign Pickup</h3><p className="text-[10px] text-primary font-bold uppercase">Processing {selectedIds.length} Bookings</p></div>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-text-muted hover:text-main bg-white/5 p-2 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">Dispatch Driver</label>
                    <div className="relative"><Search className="absolute left-3 top-3 text-text-muted" size={14}/><input className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-9 pr-4 py-2.5 text-xs text-text-main outline-none focus:border-primary transition-all" placeholder="Search driver..." value={modalSearch.driver} onChange={(e) => setModalSearch({...modalSearch, driver: e.target.value})}/></div>
                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {drivers.map(d => (<button key={d.id} onClick={() => setSelection({...selection, driver_id: d.id})} className={cn("w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all", selection.driver_id === d.id ? "bg-primary border-primary text-black" : "bg-dashboard-bg/50 border-border-subtle text-text-main hover:border-primary/50")}><span className="text-xs font-bold">{d.first_name} {d.last_name}</span><span className="text-[10px] opacity-70 font-mono">{d.phone}</span></button>))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest ml-1">Dispatch Vehicle</label>
                    <div className="relative"><Search className="absolute left-3 top-3 text-text-muted" size={14}/><input className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-9 pr-4 py-2.5 text-xs text-text-main outline-none focus:border-primary transition-all" placeholder="Search vehicle..." value={modalSearch.vehicle} onChange={(e) => setModalSearch({...modalSearch, vehicle: e.target.value})}/></div>
                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {vehicles.map(v => (<button key={v.id} onClick={() => setSelection({...selection, vehicle_id: v.id})} className={cn("w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all", selection.vehicle_id === v.id ? "bg-primary border-primary text-black" : "bg-dashboard-bg/50 border-border-subtle text-text-main hover:border-primary/50")}><span className="text-xs font-bold">{v.plate_number}</span><span className="text-[10px] opacity-70 uppercase font-bold">{v.make} {v.model}</span></button>))}
                    </div>
                </div>
                <Button disabled={submitting || !selection.driver_id || !selection.vehicle_id} onClick={handleBulkAssign} className="w-full bg-primary hover:bg-primary/90 text-black font-black h-14 rounded-2xl shadow-xl transition-all uppercase text-xs">
                  {submitting ? <Loader2 className="animate-spin mr-2"/> : "Confirm & Finalize Pickup"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL VIEW MODAL (WITH PACKAGE PAGINATION) */}
      <AnimatePresence>
        {previewOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-card-bg rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-border-subtle">
              <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-dashboard-bg/50">
                <div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-xl"><Hash className="text-primary" size={24}/></div><div><h3 className="text-xl font-bold text-text-main">Order <span className="font-mono text-primary">{previewOrder.order_number}</span></h3><p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{previewOrder.order_type}</p></div></div>
                <button onClick={() => setPreviewOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-8 custom-scrollbar">
                <div className="space-y-6">
                  <div className="p-5 bg-dashboard-bg rounded-2xl border border-border-subtle"><label className="text-[10px] font-black text-primary uppercase">Pickup Origin</label><div className="mt-3 text-[14px] text-text-main font-bold">{previewOrder.pickup_address?.contact_name}</div><div className="text-[12px] text-text-muted mt-1 leading-relaxed">{previewOrder.pickup_address?.address_line_1}, {previewOrder.pickup_address?.city}, {previewOrder.pickup_address?.pincode}</div></div>
                  <div className="p-5 bg-dashboard-bg rounded-2xl border border-border-subtle"><label className="text-[10px] font-black text-orange-500 uppercase">Destination</label><div className="mt-3 text-[14px] text-text-main font-bold">{previewOrder.consignee?.name}</div><div className="text-[12px] text-text-muted mt-1 leading-relaxed">{previewOrder.consignee?.address_line_1}, {previewOrder.consignee?.city}, {previewOrder.consignee?.pincode}</div></div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h4 className="text-xs font-bold text-text-main uppercase flex items-center gap-2"><Boxes size={16} className="text-primary"/> Package Breakdown</h4><span className="text-[10px] font-bold text-text-muted bg-dashboard-bg px-2 py-1 rounded-md">{previewOrder.packages?.length} Total</span></div>
                  <div className="space-y-3">
                    {previewOrder.packages?.slice((boxPage-1)*BOXES_PER_PAGE, boxPage*BOXES_PER_PAGE).map((pkg, idx) => (
                        <div key={pkg.id} className="p-4 bg-dashboard-bg/50 border border-border-subtle rounded-xl flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">#{(boxPage-1)*BOXES_PER_PAGE + idx + 1}</div>
                            <div className="flex-1">
                                <div className="text-[11px] font-bold text-text-main uppercase">{pkg.applicable_weight_kg} KG • {pkg.weight_unit}</div>
                                <div className="text-[10px] text-text-muted font-medium">{pkg.length_cm}x{pkg.breadth_cm}x{pkg.height_cm} CM</div>
                            </div>
                        </div>
                    ))}
                  </div>
                  {previewOrder.packages?.length > BOXES_PER_PAGE && (
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <button disabled={boxPage === 1} onClick={() => setBoxPage(p => p - 1)} className="p-1 hover:text-primary disabled:opacity-10"><ChevronLeft size={20}/></button>
                        <span className="text-[10px] font-black text-text-muted uppercase">Page {boxPage} of {Math.ceil(previewOrder.packages.length / BOXES_PER_PAGE)}</span>
                        <button disabled={boxPage === Math.ceil(previewOrder.packages.length / BOXES_PER_PAGE)} onClick={() => setBoxPage(p => p + 1)} className="p-1 hover:text-primary disabled:opacity-10"><ChevronRight size={20}/></button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-dashboard-bg/80 text-white rounded-2xl p-6 border border-border-subtle shadow-xl">
                    <div className="space-y-4">
                      <div className="flex justify-between text-[11px] text-text-muted font-bold"><span>Total Weight</span> <span className="text-text-main font-black uppercase">{previewOrder.weight_summary?.applicable_weight_kg} KG</span></div>
                      <div className="flex justify-between text-[11px] text-text-muted font-bold"><span>Payment Method</span> <span className="text-text-main font-black uppercase">{previewOrder.payment_method}</span></div>
                      <div className="pt-4 border-t border-border-subtle flex justify-between items-end">
                        <span className="text-xs text-text-muted font-bold uppercase">Grand Total</span>
                        <span className="text-3xl font-black text-primary">₹{previewOrder.grand_total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {activeTab === "pending" && (
                    <div className="flex flex-col gap-2">
                        <Button onClick={() => { setPreviewOrder(null); setSelectedIds([previewOrder.id]); setIsAssignModalOpen(true); }} className="w-full bg-primary hover:bg-primary/90 text-black font-black h-12 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">Assign Pickup</Button>
                        <Button onClick={() => { setPreviewOrder(null); handleReject(previewOrder.id); }} variant="outline" className="w-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-bold h-12 rounded-xl text-xs uppercase">Reject Order</Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}