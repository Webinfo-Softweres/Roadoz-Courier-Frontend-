import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  fetchParcelOrdersApi, 
  deleteParcelOrderApi,
  getParcelOrderDetailApi 
} from "../services/apiCalls";
import { 
  Printer, Edit, Trash2, Search, Plus, Eye, Loader2, 
  Filter, RotateCcw, Calendar, X, MapPin, User, Package,
  ChevronLeft, ChevronRight
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
  
  const [pagination, setPagination] = useState({ 
    page: 1, 
    limit: 10, 
    total: 0,
    totalPages: 0 
  });
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // --- 1. Load Orders Function ---
  const loadOrders = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = { 
        page, 
        limit: pagination.limit, 
        search: search || undefined 
      };
      const data = await fetchParcelOrdersApi(params);
      
      setOrders(data.items || []);
      setPagination({
        page: data.page || page,
        limit: data.limit || 10,
        total: data.total || 0,
        totalPages: data.pages || Math.ceil((data.total || 0) / 10)
      });
    } catch (error) {
      toast.error("Failed to load registry data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadOrders(pagination.page, searchTerm); 
  }, [pagination.page]);

  // --- 2. Corrected Delete Function ---
  const handleDelete = async (id, orderNumber) => {
    // Show confirmation dialog
    const res = await swalConfirmDelete(
      `Delete Consignment ${orderNumber}?`, 
      "This will permanently remove the record from the registry."
    );
    
    if (res.isConfirmed) {
      try {
        // Call API
        const response = await deleteParcelOrderApi(id);
        
        // Based on your response: { "success": true, "message": "..." }
        if (response.success) {
          swalSuccess("Deleted!", response.message);
          
          // logic to handle page shift if deleting last item on current page
          const isLastItemOnPage = orders.length === 1 && pagination.page > 1;
          const targetPage = isLastItemOnPage ? pagination.page - 1 : pagination.page;
          
          // Refresh list to make the product "go away"
          loadOrders(targetPage, searchTerm);
        } else {
          swalError("Failed", response.message || "Could not delete the record.");
        }
      } catch (error) {
        console.error("Delete Error:", error);
        swalError("Error", error.response?.data?.detail || "An error occurred while deleting.");
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadOrders(1, searchTerm);
  };

  const handleViewDetails = async (id) => {
    setViewLoading(true);
    try {
      const data = await getParcelOrderDetailApi(id);
      setSelectedOrder(data);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error("Could not fetch details");
    } finally {
      setViewLoading(false);
    }
  };

  const inputClass = "bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full";

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">Consignment Registry</h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium italic">Outgoing Shipment Management</p>
        </div>
        {/* <Button onClick={() => navigate("/dashboard/new-orders")} className="bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg transition-transform active:scale-95">
          <Plus size={18} className="mr-2" /> Create New Parcel
        </Button> */}
      </div>

      {/* Filter Card */}
      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1 tracking-widest">Global Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input 
                  type="text" 
                  placeholder="Consignment ID, Sender or Receiver..." 
                  className={cn(inputClass, "pl-10")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs font-bold">
                <Filter size={14} className="mr-2" /> Filter
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setSearchTerm(""); loadOrders(1, ""); }} className="h-9 px-3 text-text-muted border border-border-subtle hover:bg-dashboard-bg">
                <RotateCcw size={16} />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-6 py-4">Consignment ID</th>
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Receiver</th>
                  <th className="px-6 py-4 text-center">Method</th>
                  <th className="px-6 py-4">Net Amt</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={32} /></td></tr>
                ) : orders.length === 0 ? (
                    <tr><td colSpan="6" className="py-20 text-center text-text-muted text-sm italic">Registry is currently empty.</td></tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-dashboard-bg/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-primary text-xs tracking-tighter">{order.order_number}</div>
                        <div className="flex items-center gap-1 text-[9px] text-text-muted mt-1 uppercase">
                          <Calendar size={10} /> {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-text-main leading-none">{order.sender_name}</div>
                        <div className="text-[10px] text-text-muted mt-1 uppercase tracking-tight">{order.sender_city}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-text-main leading-none">{order.receiver_name}</div>
                        <div className="text-[10px] text-text-muted mt-1 uppercase tracking-tight">{order.receiver_city}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-primary/20">
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-text-main">₹{order.total_freight}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            disabled={viewLoading}
                            onClick={() => handleViewDetails(order.id)}
                            className="w-8 h-8 flex items-center justify-center text-text-muted bg-dashboard-bg border border-border-subtle rounded-lg hover:text-primary transition-all"
                            title="View Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => navigate(`/dashboard/parcel-orders/invoice/${order.id}`)}
                            className="w-8 h-8 flex items-center justify-center text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-lg hover:bg-blue-400/30 transition-all"
                            title="Print Label"
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            onClick={() => navigate(`/dashboard/parcel-orders/edit/${order.id}`)}
                            className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/30 transition-all"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          {/* DELETE BUTTON */}
                          <button 
                            onClick={() => handleDelete(order.id, order.order_number)}
                            className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            title="Delete Permanently"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-border-subtle gap-4 bg-dashboard-bg/30">
              <p className="text-xs text-text-muted font-medium">
                Records: <span className="text-text-main font-bold">{orders.length}</span> of <span className="text-text-main font-bold">{pagination.total}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="border-border-subtle hover:border-primary text-text-muted h-8"
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <div className="flex items-center gap-1 font-mono text-xs font-bold">
                    <span className="bg-primary text-black px-2 py-1 rounded">{pagination.page}</span>
                    <span className="text-text-muted mx-1">/</span>
                    <span className="text-text-main">{pagination.totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="border-border-subtle hover:border-primary text-text-muted h-8"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Detail Modal --- */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-2xl bg-card-bg border-border-subtle shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-dashboard-bg/50">
                    <div className="flex items-center gap-2">
                        <Package className="text-primary" size={20} />
                        <h2 className="font-bold text-text-main uppercase tracking-widest text-xs">Consignment Snapshot</h2>
                    </div>
                    <button onClick={() => setIsDetailsOpen(false)} className="p-1 hover:bg-red-500/20 text-text-muted hover:text-red-500 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <CardContent className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-border-subtle">
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Reference ID</p>
                            <p className="text-sm font-mono font-bold text-primary">{selectedOrder.order_number}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Creation Date</p>
                            <p className="text-sm text-text-main font-bold">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Payment Mode</p>
                            <p className="text-xs text-text-main font-bold uppercase">{selectedOrder.payment_method}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Registry Value</p>
                            <p className="text-sm text-green-500 font-bold font-mono">₹{selectedOrder.total_freight}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <User size={14} />
                                <span className="text-[10px] font-bold uppercase">Consignor</span>
                            </div>
                            <div className="p-3 bg-dashboard-bg/40 rounded-lg border border-border-subtle">
                                <p className="font-bold text-sm text-text-main uppercase">{selectedOrder.sender_name}</p>
                                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{selectedOrder.sender_address_line_1}</p>
                                <p className="text-xs text-primary font-mono font-bold mt-2 tracking-tight">{selectedOrder.sender_mobile}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-orange-500">
                                <MapPin size={14} />
                                <span className="text-[10px] font-bold uppercase">Consignee</span>
                            </div>
                            <div className="p-3 bg-dashboard-bg/40 rounded-lg border border-border-subtle">
                                <p className="font-bold text-sm text-text-main uppercase">{selectedOrder.receiver_name}</p>
                                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{selectedOrder.receiver_address_line_1}</p>
                                <p className="text-xs text-orange-500 font-mono font-bold mt-2 tracking-tight">{selectedOrder.receiver_mobile}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <div className="p-4 bg-dashboard-bg/50 border-t border-border-subtle flex justify-end">
                    <Button onClick={() => setIsDetailsOpen(false)} className="bg-primary text-black font-bold text-xs px-8 h-9 uppercase">
                        Close Snapshot
                    </Button>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
};

export default ProcessingParcel;