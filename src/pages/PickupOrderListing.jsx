import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Search, MapPin, ArrowLeft, Loader2, User, 
  Phone, Package, ArrowRight, RotateCcw, Calendar, Filter, Download
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Pagination from "../components/ui/Pagination";
import { fetchOrdersByEntity } from "../redux/orderSlice";
import { cn } from "../lib/utils";
import { downloadInvoiceExcel } from "../lib/invoiceExcel"; 
import toast from "react-hot-toast";

export function PickupOrderListing() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    search_by: "pickup_address", 
    name: "",
    pincode: "",
    start_date: "",
    end_date: "",
    limit: 10,
  });

  const [currentPage, setCurrentPage] = useState(1);

  const { orders, totalOrders, totalPages, loading } = useSelector((state) => state.orders);

  // FETCH LOGIC - Validation removed to allow "List All"
  const fetchData = (page = 1) => {
    dispatch(fetchOrdersByEntity({
      search_by: filters.search_by,
      name: filters.name.trim() || undefined, // Send undefined if empty
      pincode: filters.pincode.trim() || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      page: page,
      limit: filters.limit
    }));
  };

  // EFFECT - Triggered on mount and whenever page/limit changes
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, filters.limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData(1);
  };

  const clearFilters = () => {
    const defaultFilters = {
      search_by: "pickup_address",
      name: "",
      pincode: "",
      start_date: "",
      end_date: "",
      limit: 10,
    };
    setFilters(defaultFilters);
    setCurrentPage(1);
    // Explicitly fetch with defaults
    dispatch(fetchOrdersByEntity({ ...defaultFilters, page: 1 }));
  };

  const handleExport = () => {
    if (orders.length === 0) {
      return toast.error("No data available to export");
    }
    downloadInvoiceExcel(orders);
    toast.success("Exporting data to sheet...");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-text-muted" />
             </button>
             <h1 className="text-2xl font-bold text-text-main">Entity Order Search</h1>
          </div>
          <p className="text-sm text-text-muted ml-10">
            Search orders by <strong>{filters.search_by === 'pickup_address' ? 'Pickup Location' : 'Consignee'}</strong> details
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={handleExport} 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary hover:text-black font-bold h-11 px-6 shadow-sm flex-1 md:flex-none"
          >
            <Download size={18} className="mr-2" /> Export to Sheet
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="bg-card-bg border-border-subtle shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest">search_by *</label>
              <select 
                className="w-full bg-dashboard-bg/50 border border-border-subtle rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                value={filters.search_by}
                onChange={(e) => setFilters({...filters, search_by: e.target.value})}
              >
                <option value="pickup_address">pickup_address</option>
                <option value="consignee">consignee</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name..."
                  className="w-full bg-dashboard-bg/50 border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary"
                  value={filters.name}
                  onChange={(e) => setFilters({...filters, name: e.target.value})}
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Pincode</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 682011"
                  className="w-full bg-dashboard-bg/50 border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary"
                  value={filters.pincode}
                  onChange={(e) => setFilters({...filters, pincode: e.target.value})}
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-dashboard-bg/50 border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none"
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-dashboard-bg/50 border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none"
                  value={filters.end_date}
                  onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-primary text-black font-bold h-[42px] uppercase text-xs tracking-wider shadow-md">
                <Filter size={14} className="mr-2"/> Filter
              </Button>
              <Button type="button" variant="outline" onClick={clearFilters} className="h-[42px] px-3 border-border-subtle hover:bg-gray-100">
                <RotateCcw size={18} />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="bg-card-bg border-border-subtle overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-text-muted font-medium tracking-wide">Retrieving data...</p>
            </div>
          ) : orders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dashboard-bg/50 text-text-muted text-[11px] font-bold uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-6 py-5">Order Reference</th>
                      <th className="px-6 py-5">Pickup Details</th>
                      <th className="px-6 py-5">Consignee Details</th>
                      <th className="px-6 py-5">Route</th>
                      <th className="px-6 py-5">Value</th>
                      <th className="px-6 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-dashboard-bg/10 transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-primary">#{order.order_number}</p>
                          <p className="text-[10px] text-text-muted mt-1 font-medium">{formatDateTime(order.created_at)}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className={cn("p-2 rounded-lg", filters.search_by === 'pickup_address' ? "bg-primary/10 border border-primary/30" : "opacity-60")}>
                            <p className="text-xs font-bold text-text-main">{order.pickup_address?.contact_name || 'N/A'}</p>
                            <p className="text-[10px] text-text-muted">{order.pickup_address?.pincode}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={cn("p-2 rounded-lg", filters.search_by === 'consignee' ? "bg-primary/10 border border-primary/30" : "opacity-60")}>
                            <p className="text-xs font-bold text-text-main">{order.consignee?.name || 'N/A'}</p>
                            <p className="text-[10px] text-text-muted">{order.consignee?.pincode}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold">
                           {order.pickup_address?.city} → {order.consignee?.city}
                        </td>
                        <td className="px-6 py-5 text-xs font-bold">
                          ₹{order.grand_total?.toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-border-subtle bg-dashboard-bg/5">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalEntries={totalOrders}
                  limit={filters.limit}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Search size={40} className="text-text-muted mb-4" />
              <h3 className="text-lg font-bold text-text-main">No Orders Found</h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}