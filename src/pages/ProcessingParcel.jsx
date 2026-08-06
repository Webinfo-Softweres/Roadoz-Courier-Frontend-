import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchParcelOrdersApi, deleteParcelOrderApi, createParcelTripsheetApi } from "../services/apiCalls";
import { generateParcelInvoice } from "../lib/PrintParcelHelpers";
import { 
  Printer, Edit, Trash2, Search, Loader2, Filter, 
  RotateCcw, X, Truck, Gauge, CheckSquare, Square, 
  User, Phone, MapPin, Navigation, LayoutGrid
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";
import { swalConfirmDelete, swalSuccess, swalError } from "../lib/swal";

const ProcessingParcel = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Simplified Manifest Form based on your request
  const [manifestForm, setManifestForm] = useState({
    driver_name: "",
    mobile: "",
    vehicle_number: "",
    vehicle_type: "",
    starting_kilometer: "",
    city_destination: "", // Final Route Destination
    city_routes: ""      // Transit Path
  });

  const loadOrders = async (page = 1) => {
    setLoading(true);
    try {
      const data = await fetchParcelOrdersApi({ page, limit: 10, search: searchTerm || undefined });
      setOrders(data.items || []);
      setPagination({ page: data.page, limit: 10, total: data.total });
    } catch (error) { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(pagination.page); }, [pagination.page]);

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) setSelectedIds([]);
    else setSelectedIds(orders.map(o => o.id));
  };

  const handleCreateManifest = async (e) => {
    e.preventDefault();
    setManifestLoading(true);
    try {
      // Extracting the Order Numbers (Barcodes) for selected items
      const selectedBarcodes = orders
        .filter(o => selectedIds.includes(o.id))
        .map(o => o.order_number);

      const payload = {
        ...manifestForm,
        barcodes: selectedBarcodes,
        // Optional/Default fields to satisfy backend requirements if any
        email: "logistics@roadoz.com",
        gender: "Male",
        city: manifestForm.city_destination,
        state: "State",
        country: "India",
        address: "Manifest generated from Hub",
        vehicle_model: "Standard",
        fuel_type: "Diesel",
        city_routes: manifestForm.city_routes ? manifestForm.city_routes.split(",").map(r => r.trim()) : [],
        starting_kilometer: Number(manifestForm.starting_kilometer)
      };

      await createParcelTripsheetApi(payload);
      swalSuccess("Manifest Created", "Trip sheet generated successfully.");
      setIsManifestModalOpen(false);
      setSelectedIds([]);
      navigate("/dashboard/parcel-orders/tripsheet");
    } catch (error) {
      swalError("Error", error.response?.data?.detail || "Failed to create manifest");
    } finally { setManifestLoading(false); }
  };

  const handleDelete = async (id, orderNumber) => {
    const res = await swalConfirmDelete(`Delete ${orderNumber}?`);
    if (res.isConfirmed) {
      try {
        await deleteParcelOrderApi(id);
        swalSuccess("Deleted");
        loadOrders(pagination.page);
      } catch (error) { swalError("Error", "Delete failed"); }
    }
  };

  const inputClass = "w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-muted/30";

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main uppercase tracking-tight">Consignment Registry</h1>
          <p className="text-xs text-primary mt-1 font-medium italic uppercase tracking-widest">Process & Dispatch Management</p>
        </div>
        {selectedIds.length > 0 && (
          <Button onClick={() => setIsManifestModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-black font-black h-14 px-8 rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20">
            <Truck size={20} className="mr-2" /> Create Trip Manifest ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Filter Section */}
      <Card className="bg-card-bg border-border-subtle shadow-xl">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Order Lookup</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  className={cn(inputClass, "pl-12 h-14")} 
                  placeholder="Search by Order ID, Sender, or City..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={() => loadOrders(1)} className="bg-primary text-black font-black h-14 px-10 rounded-xl uppercase tracking-widest text-xs flex-1 md:flex-none">
                    <Filter size={18} className="mr-2"/> Filter
                </Button>
                <Button variant="outline" onClick={() => { setSearchTerm(""); loadOrders(1); }} className="border-border-subtle bg-card-bg text-text-muted h-14 w-14 rounded-xl flex items-center justify-center p-0">
                    <RotateCcw size={20}/>
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="bg-card-bg border-border-subtle overflow-hidden rounded-2xl shadow-2xl border-t-4 border-t-primary">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#171717] text-text-muted text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                    <th className="px-6 py-5 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-primary hover:scale-110 transition-transform">
                        {selectedIds.length === orders.length && orders.length > 0 ? <CheckSquare size={20}/> : <Square size={20}/>}
                      </button>
                    </th>
                    <th className="px-6 py-5">Order ID</th>
                    <th className="px-6 py-5">Sender Details</th>
                    <th className="px-6 py-5">Receiver Details</th>
                    <th className="px-6 py-5">Freight Amount</th>
                    <th className="px-6 py-5 text-right">Action Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {loading ? (
                    <tr><td colSpan="6" className="py-24 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={40} /></td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan="6" className="py-24 text-center text-text-muted font-bold text-[10px] uppercase tracking-widest opacity-40">No pending consignments found</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className={cn("hover:bg-primary/[0.02] transition-colors group", selectedIds.includes(order.id) && "bg-primary/[0.04]")}>
                        <td className="px-6 py-5 text-center">
                           <button onClick={() => setSelectedIds(prev => prev.includes(order.id) ? prev.filter(i => i !== order.id) : [...prev, order.id])} className={cn("transition-all", selectedIds.includes(order.id) ? "text-primary scale-110" : "text-text-muted opacity-30")}>
                             {selectedIds.includes(order.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                           </button>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-black text-primary text-xs uppercase tracking-tighter">{order.order_number}</div>
                          <div className="text-[10px] text-text-muted mt-1 font-bold">{new Date(order.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-text-main uppercase">{order.sender_name}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase mt-1 opacity-60"><MapPin size={10} className="inline mr-1"/> {order.sender_city}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-text-main uppercase">{order.receiver_name}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase mt-1 opacity-60"><Navigation size={10} className="inline mr-1"/> {order.receiver_city}</p>
                        </td>
                        <td className="px-6 py-5">
                           <div className="text-xs font-black text-text-main">₹{Number(order.total_freight).toLocaleString()}</div>
                           <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">{order.payment_method}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => generateParcelInvoice(order)} className="p-2.5 bg-dashboard-bg/50 text-text-muted hover:text-blue-500 rounded-xl border border-border-subtle/50 transition-all"><Printer size={16}/></button>
                             <button onClick={() => navigate(`/dashboard/parcel-orders/edit/${order.id}`)} className="p-2.5 bg-dashboard-bg/50 text-text-muted hover:text-primary rounded-xl border border-border-subtle/50 transition-all"><Edit size={16}/></button>
                             <button onClick={() => handleDelete(order.id, order.order_number)} className="p-2.5 bg-dashboard-bg/50 text-text-muted hover:text-red-500 rounded-xl border border-border-subtle/50 transition-all"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DARK THEME TRIP MANIFEST MODAL */}
      {isManifestModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
             <Card className="w-full max-w-2xl bg-card-bg border border-border-subtle rounded-3xl shadow-2xl overflow-hidden">
                <form onSubmit={handleCreateManifest}>
                    <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/40">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20"><Truck size={24} /></div>
                            <div>
                                <h2 className="font-black text-text-main uppercase text-sm tracking-widest">Generate Trip Manifest</h2>
                                <p className="text-[10px] text-text-muted font-black tracking-widest uppercase">{selectedIds.length} Consignments Selected</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setIsManifestModalOpen(false)} className="p-3 text-text-muted hover:text-red-500 transition-all"><X size={24}/></button>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        
                        {/* Driver Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-border-subtle pb-2">Logistics Personal</h3>
                            <div>
                                <label className="text-[9px] font-black text-text-muted uppercase mb-1.5 block ml-1">Driver Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={14} />
                                    <input required className={cn(inputClass, "pl-10")} value={manifestForm.driver_name} onChange={e => setManifestForm({...manifestForm, driver_name: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-text-muted uppercase mb-1.5 block ml-1">Contact Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={14} />
                                    <input required className={cn(inputClass, "pl-10")} value={manifestForm.mobile} onChange={e => setManifestForm({...manifestForm, mobile: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-border-subtle pb-2">Vehicle Assets</h3>
                            <div>
                                <label className="text-[9px] font-black text-text-muted uppercase mb-1.5 block ml-1">Plate Number</label>
                                <input required placeholder="KL-00-XX-0000" className={inputClass} value={manifestForm.vehicle_number} onChange={e => setManifestForm({...manifestForm, vehicle_number: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-text-muted uppercase mb-1.5 block ml-1">Vehicle Type</label>
                                <input required placeholder="E.g. Mini Truck, Pickup" className={inputClass} value={manifestForm.vehicle_type} onChange={e => setManifestForm({...manifestForm, vehicle_type: e.target.value})} />
                            </div>
                        </div>

                        {/* Operational Details */}
                        <div className="col-span-full space-y-4 pt-2">
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-border-subtle pb-2">Trip Logistics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[9px] font-black text-text-muted uppercase mb-1.5 block ml-1">Starting Odometer (KM)</label>
                                    <div className="relative">
                                        <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={14} />
                                        <input type="number" required className={cn(inputClass, "pl-10")} value={manifestForm.starting_kilometer} onChange={e => setManifestForm({...manifestForm, starting_kilometer: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-text-muted uppercase mb-1.5 block ml-1">Final Destination City</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={14} />
                                        <input required className={cn(inputClass, "pl-10")} value={manifestForm.city_destination} onChange={e => setManifestForm({...manifestForm, city_destination: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-text-muted uppercase mb-1.5 block ml-1">Transit Routes (Via - Comma Separated)</label>
                                <div className="relative">
                                    <textarea placeholder="Route A, Route B, Route C..." required className={cn(inputClass, "min-h-[100px] resize-none")} rows={3} value={manifestForm.city_routes} onChange={e => setManifestForm({...manifestForm, city_routes: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-border-subtle bg-dashboard-bg/40 flex justify-end gap-3">
                        <Button type="button" variant="outline" className="border-border-subtle font-black text-[10px] tracking-widest" onClick={() => setIsManifestModalOpen(false)}>CANCEL</Button>
                        <Button disabled={manifestLoading} className="bg-primary text-black font-black px-12 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                            {manifestLoading ? <Loader2 className="animate-spin" /> : "EXECUTE MANIFEST"}
                        </Button>
                    </div>
                </form>
             </Card>
        </div>
      )}
    </div>
  );
};

export default ProcessingParcel;