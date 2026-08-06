import React, { useEffect, useState } from "react";
import { 
  fetchParcelTripsheetsApi, 
  getParcelTripsheetDetailApi, 
  updateParcelTripsheetApi, 
  deleteParcelTripsheetApi 
} from "../services/apiCalls";
import { 
  Search, Eye, Printer, X, Truck, MapPin, User, Hash, 
  Filter, Loader2, Trash2, Edit, Navigation, Calendar, 
  Phone, RotateCcw, Package, Activity, MoveRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";
import { swalConfirmDelete, swalSuccess, swalError } from "../lib/swal";

// IMPORT THE PRINT UTILITY
import { generateTripSheetPrint } from "../lib/PrintTripSheetParcel";

const TripsheetRegistry = () => {   
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  
  // Modal States
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const data = await fetchParcelTripsheetsApi({ 
        page, 
        limit: 10, 
        search: searchTerm || undefined 
      });
      setItems(data.items || []);
      setPagination({
        page: data.page || page,
        limit: 10,
        total: data.total || 0,
        totalPages: data.pages || 1
      });
    } catch (error) { 
      toast.error("Failed to load registry"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(pagination.page); }, [pagination.page]);

  const handlePrint = async (id) => {
    setLoading(true);
    try {
      const fullData = await getParcelTripsheetDetailApi(id);
      if (fullData) generateTripSheetPrint(fullData);
    } catch (error) {
      toast.error("Failed to prepare manifest for printing");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    setLoading(true);
    try {
      const fullData = await getParcelTripsheetDetailApi(id);
      setSelectedSheet(fullData);
      setIsDetailOpen(true);
    } catch (error) { 
      toast.error("Failed to fetch manifest details"); 
    } finally { 
      setLoading(false); 
    }
  };

  const openEdit = async (id) => {
    setLoading(true);
    try {
      const fullData = await getParcelTripsheetDetailApi(id);
      setEditForm({
        ...fullData,
        city_routes: fullData.city_routes ? fullData.city_routes.join(", ") : ""
      });
      setIsEditOpen(true);
    } catch (error) {
      toast.error("Error fetching data for edit");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...editForm,
        city_routes: editForm.city_routes.split(",").map(r => r.trim()).filter(r => r !== ""),
        starting_kilometer: Number(editForm.starting_kilometer),
        ending_kilometer: editForm.ending_kilometer ? Number(editForm.ending_kilometer) : 0
      };

      await updateParcelTripsheetApi(editForm.id, payload);
      swalSuccess("Updated", "Tripsheet updated successfully.");
      setIsEditOpen(false);
      loadData(pagination.page);
    } catch (error) {
      swalError("Update Failed", error.response?.data?.detail || "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const res = await swalConfirmDelete("Delete Trip Sheet?", "Permanently remove this manifest record?");
    if (res.isConfirmed) {
      try {
        await deleteParcelTripsheetApi(id);
        swalSuccess("Deleted", "Trip manifest removed.");
        loadData(pagination.page);
      } catch (error) {
        swalError("Error", "Failed to delete tripsheet");
      }
    }
  };

  const inputClass = "w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-muted/30";

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main uppercase tracking-tight">Trip Sheet Registry</h1>
          <p className="text-xs text-primary mt-1 font-medium italic uppercase tracking-widest">Parcel Logistics Database</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => loadData(1)} className="border-border-subtle bg-card-bg text-text-main hover:bg-primary hover:text-black font-black px-6 rounded-xl transition-all">
                <RotateCcw size={16} className="mr-2"/> REFRESH REGISTRY
            </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="bg-card-bg border-border-subtle shadow-2xl">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Database Search</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  className={cn(inputClass, "pl-12 h-14")} 
                  placeholder="Driver Name, Plate Number, or Destination..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <Button onClick={() => loadData(1)} className="bg-primary text-black font-black h-14 px-10 rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
              <Filter size={18} className="mr-2"/> Apply Filters
            </Button>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="bg-card-bg border-border-subtle overflow-hidden rounded-2xl shadow-2xl border-t-4 border-t-primary">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#171717] text-text-muted text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                    <th className="px-6 py-5">Manifest ID</th>
                    <th className="px-6 py-5">Driver Details</th>
                    <th className="px-6 py-5">Vehicle Logistics</th>
                    <th className="px-6 py-5">Route Path</th>
                    <th className="px-6 py-5">Trip Status</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {loading ? (
                    <tr><td colSpan="6" className="py-24 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={40} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan="6" className="py-24 text-center text-text-muted font-bold text-[10px] uppercase tracking-[0.2em] opacity-40">No records found in database</td></tr>
                  ) : (
                    items.map(item => (
                      <tr key={item.id} className="hover:bg-primary/[0.02] transition-colors group border-b border-border-subtle/20">
                        <td className="px-6 py-5">
                          <div className="font-black text-primary text-xs uppercase tracking-tighter">{item.id.split('-')[0]}</div>
                          <div className="text-[10px] text-text-muted mt-1 font-bold">
                            {new Date(item.created_at).toLocaleDateString("en-GB")}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-text-main uppercase">{item.driver_name}</p>
                          <p className="text-[10px] text-text-muted font-medium mt-1">{item.mobile}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-black text-text-main uppercase tracking-tight">{item.vehicle_number}</p>
                          <p className="text-[9px] text-text-muted uppercase font-bold mt-1 opacity-60">{item.vehicle_type}</p>
                        </td>
                        <td className="px-6 py-5">
                          {/* FIXED ROUTE PATH COLUMN */}
                          <div className="flex items-center gap-2">
                             <MapPin size={12} className="text-primary" />
                             <span className="font-black text-[10px] uppercase text-text-main tracking-tight">{item.city_destination}</span>
                          </div>
                          {item.city_routes && item.city_routes.length > 0 && (
                            <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                                <p className="text-[9px] text-text-muted font-bold uppercase truncate max-w-[140px]">
                                    Via: {item.city_routes.join(", ")}
                                </p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                           <span className={cn(
                             "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                             item.status === "Delivered" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                             item.status === "In Transit" ? "bg-sky-500/10 text-sky-500 border border-sky-500/20" : 
                             "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                           )}>
                             {item.status}
                           </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openDetail(item.id)} className="p-2.5 bg-dashboard-bg/50 text-text-muted hover:text-primary rounded-xl border border-border-subtle/50 transition-all"><Eye size={16}/></button>
                             <button onClick={() => openEdit(item.id)} className="p-2.5 bg-dashboard-bg/50 text-text-muted hover:text-sky-500 rounded-xl border border-border-subtle/50 transition-all"><Edit size={16}/></button>
                             <button onClick={() => handlePrint(item.id)} className="p-2.5 bg-dashboard-bg/50 text-text-muted hover:text-emerald-500 rounded-xl border border-border-subtle/50 transition-all"><Printer size={16}/></button>
                             <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-dashboard-bg/50 text-text-muted hover:text-red-500 rounded-xl border border-border-subtle/50 transition-all"><Trash2 size={16}/></button>
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

      {/* DARK DETAIL MODAL */}
      {isDetailOpen && selectedSheet && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-4xl bg-card-bg border border-border-subtle rounded-3xl shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-dashboard-bg/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20"><Package size={24} /></div>
                <div>
                    <h2 className="font-black text-text-main uppercase text-sm tracking-widest">Trip Manifest Summary</h2>
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">{selectedSheet.id}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-3 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Logistics Section */}
                <div className="space-y-6 bg-dashboard-bg/40 p-6 rounded-2xl border border-border-subtle/30">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-primary"/>
                        <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest">Personal Info</h4>
                    </div>
                    <div>
                        <p className="font-black text-base text-text-main uppercase">{selectedSheet.driver_name}</p>
                        <p className="text-xs text-text-muted font-bold mt-1">{selectedSheet.mobile}</p>
                        <p className="text-[9px] text-primary font-black uppercase mt-6 tracking-widest">Assigned Vehicle</p>
                        <p className="text-sm font-black text-text-main uppercase">{selectedSheet.vehicle_number}</p>
                    </div>
                </div>

                {/* Route Section */}
                <div className="space-y-6 bg-dashboard-bg/40 p-6 rounded-2xl border border-border-subtle/30">
                    <div className="flex items-center gap-2">
                        <Navigation size={14} className="text-primary"/>
                        <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest">Route Data</h4>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Final Destination</p>
                        <p className="font-black text-base text-text-main uppercase">{selectedSheet.city_destination}</p>
                        <div className="mt-6 flex gap-6">
                            <div>
                                <p className="text-[9px] font-black text-text-muted uppercase">Start KM</p>
                                <p className="text-xs font-black text-text-main">{selectedSheet.starting_kilometer} KM</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-text-muted uppercase">End KM</p>
                                <p className="text-xs font-black text-primary">{selectedSheet.ending_kilometer || "RUNNING"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Column */}
                <div className="bg-dashboard-bg/40 p-6 rounded-2xl border border-border-subtle/30 flex flex-col justify-center items-center text-center">
                    <div className="p-4 bg-primary/5 rounded-full mb-4 border border-primary/10"><Activity size={24} className="text-primary"/></div>
                    <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-2">Live Progress</p>
                    <div className={cn(
                        "px-6 py-2 rounded-xl border font-black text-xs uppercase tracking-[0.2em]",
                        selectedSheet.status === "Delivered" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    )}>
                        {selectedSheet.status}
                    </div>
                </div>

                {/* Parcel Grid */}
                <div className="col-span-full pt-4">
                   <div className="flex items-center justify-between mb-4 px-2">
                        <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                            <Hash size={14} className="text-primary"/> Linked Consignments ({selectedSheet.parcel_orders?.length || 0})
                        </h4>
                   </div>
                   <div className="max-h-52 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {selectedSheet.parcel_orders?.map((order, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 bg-dashboard-bg/20 border border-border-subtle rounded-2xl hover:border-primary/40 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="p-2 bg-card-bg rounded-xl border border-border-subtle"><Truck size={16} className="text-text-muted"/></div>
                                <div>
                                    <p className="text-xs font-black text-primary uppercase tracking-tighter">{order.order_number}</p>
                                    <p className="text-[9px] text-text-muted font-black uppercase mt-0.5">{order.sender_name} <MoveRight size={10} className="inline mx-1"/> {order.receiver_name}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-text-main uppercase tracking-tight">{order.receiver_city}</p>
                                <p className="text-[9px] text-primary/60 font-black tracking-widest">{order.payment_method}</p>
                             </div>
                          </div>
                        ))}
                   </div>
                </div>
            </div>
            
            <div className="p-6 bg-dashboard-bg/40 border-t border-border-subtle flex justify-end gap-3">
                <Button variant="outline" className="border-border-subtle bg-transparent text-text-muted hover:text-text-main uppercase font-black text-[10px] tracking-widest" onClick={() => setIsDetailOpen(false)}>CLOSE VIEW</Button>
                <Button className="bg-primary text-black font-black px-12 rounded-xl uppercase text-[10px] tracking-widest" onClick={() => handlePrint(selectedSheet.id)}>
                    <Printer size={18} className="mr-2"/> PRINT DATA
                </Button>
            </div>
          </Card>
        </div>
      )}

      {/* DARK UPDATE MODAL */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
          <Card className="w-full max-w-2xl bg-card-bg border border-border-subtle rounded-3xl shadow-2xl overflow-hidden">
            <form onSubmit={handleUpdate}>
                <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-dashboard-bg/40">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-sky-500/10 text-sky-500 rounded-2xl border border-sky-500/20"><Edit size={24} /></div>
                        <h2 className="font-black text-text-main uppercase text-sm tracking-widest">Update Logistics Data</h2>
                    </div>
                    <button type="button" onClick={() => setIsEditOpen(false)} className="p-3 text-text-muted hover:text-text-main rounded-full"><X size={24} /></button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="col-span-full">
                        <label className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-2 block ml-1">Live Manifest Status</label>
                        <select 
                          className={cn(inputClass, "font-black text-primary cursor-pointer")}
                          value={editForm.status}
                          onChange={e => setEditForm({...editForm, status: e.target.value})}
                        >
                            <option value="Dispatched">Dispatched</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered (Completed)</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b border-border-subtle pb-2">Logistics Crew</h4>
                        <div>
                            <label className="text-[9px] font-black uppercase text-text-muted mb-1.5 block ml-1">Driver Name</label>
                            <input required className={inputClass} value={editForm.driver_name} onChange={e => setEditForm({...editForm, driver_name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-text-muted mb-1.5 block ml-1">Contact Phone</label>
                            <input required className={inputClass} value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b border-border-subtle pb-2">Odometer / KM</h4>
                        <div>
                            <label className="text-[9px] font-black uppercase text-text-muted mb-1.5 block ml-1">Start Kilometer</label>
                            <input type="number" required className={inputClass} value={editForm.starting_kilometer} onChange={e => setEditForm({...editForm, starting_kilometer: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-text-muted mb-1.5 block ml-1">End Kilometer</label>
                            <input type="number" className={cn(inputClass, "border-primary/40")} value={editForm.ending_kilometer || ""} onChange={e => setEditForm({...editForm, ending_kilometer: e.target.value})} />
                        </div>
                    </div>

                    <div className="col-span-full space-y-4 pt-2">
                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b border-border-subtle pb-2">Route Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black uppercase text-text-muted mb-1.5 block ml-1">Destination City</label>
                                <input required className={inputClass} value={editForm.city_destination} onChange={e => setEditForm({...editForm, city_destination: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-text-muted mb-1.5 block ml-1">Plate Number</label>
                                <input required className={inputClass} value={editForm.vehicle_number} onChange={e => setEditForm({...editForm, vehicle_number: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-text-muted mb-1.5 block ml-1">Transit Routes (Comma Separated)</label>
                            <textarea className={cn(inputClass, "min-h-[100px] resize-none")} value={editForm.city_routes} onChange={e => setEditForm({...editForm, city_routes: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border-subtle bg-dashboard-bg/40 flex justify-end gap-3">
                    <Button type="button" variant="outline" className="border-border-subtle font-black text-[10px] tracking-widest" onClick={() => setIsEditOpen(false)}>CANCEL</Button>
                    <Button disabled={actionLoading} type="submit" className="bg-primary text-black font-black px-12 rounded-xl uppercase text-[10px] tracking-widest">
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : "SAVE UPDATES"}
                    </Button>
                </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TripsheetRegistry;