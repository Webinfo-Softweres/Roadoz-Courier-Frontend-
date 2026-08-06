import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  PlusCircle, 
  ArrowLeft, 
  Loader2, 
  Hash, 
  ClipboardList,
  Phone,
  Truck,
  IndianRupee,
  Save
} from 'lucide-react';
import { 
  createParcelOrderApi, 
  updateParcelOrderApi, 
  getParcelOrderDetailApi 
} from '../services/apiCalls';
import { toast } from 'react-hot-toast';

// Theme-based UI Components
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";

const CreateParcel = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sender: { name: "", mobile: "", address_line_1: "", pincode: "", city: "", state: "" },
    receiver: { name: "", mobile: "", address_line_1: "", pincode: "", city: "", state: "" },
    payment_method: "Prepaid",
    order_value: 0,
    weight_kg: 0,
    freight_charge: 0,
    product_name: "",
    qty: 1,
    gst_number: "",
    eway_bill_number: "",
    insurance: 0,
    remarks: ""
  });

  // --- Theme Classes ---
  const inputClass = "bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary transition-all w-full placeholder:text-text-muted/30 focus:ring-1 focus:ring-primary/30";
  const labelClass = "text-[10px] font-bold uppercase text-text-muted ml-1 mb-1 block tracking-widest";
  const optionClass = "bg-[#1a1a1a] text-text-main"; 

  // --- Fetch Data for Edit Mode ---
  useEffect(() => {
    if (isEdit) {
      const fetchOrderDetails = async () => {
        try {
          setLoading(true);
          const data = await getParcelOrderDetailApi(id);
          setFormData({
            sender: {
              name: data.sender_name || "",
              mobile: data.sender_mobile || "",
              address_line_1: data.sender_address_line_1 || "",
              pincode: data.sender_pincode || "",
              city: data.sender_city || "",
              state: data.sender_state || ""
            },
            receiver: {
              name: data.receiver_name || "",
              mobile: data.receiver_mobile || "",
              address_line_1: data.receiver_address_line_1 || "",
              pincode: data.receiver_pincode || "",
              city: data.receiver_city || "",
              state: data.receiver_state || ""
            },
            payment_method: data.payment_method || "Prepaid",
            order_value: data.order_value || 0,
            weight_kg: data.weight_kg || 0,
            freight_charge: data.freight_charge || 0,
            product_name: data.product_name || "",
            qty: data.qty || 1,
            gst_number: data.gst_number || "",
            eway_bill_number: data.eway_bill_number || "",
            insurance: data.insurance || 0,
            remarks: data.remarks || ""
          });
        } catch (error) {
          toast.error("Failed to load consignment details");
          navigate('/dashboard/parcel-orders');
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetails();
    }
  }, [id, isEdit, navigate]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      if (e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const nextElement = form.elements[index + 1];
        if (nextElement) nextElement.focus();
      }
    }
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Logic Updated: Total Freight is now exactly what the user enters (No GST addition)
      const finalAmount = Number(formData.freight_charge);
      
      const payload = {
        ...formData,
        freight_gst: 0, // Set to 0 as per your requirement
        total_freight: finalAmount, // Total is now exactly equal to entered charge
        prepaid_amount: formData.payment_method === 'Prepaid' ? finalAmount : 0,
        cod_amount: formData.payment_method === 'COD' ? formData.order_value : 0,
      };

      if (isEdit) {
        await updateParcelOrderApi(id, payload);
        toast.success("Consignment Updated Successfully");
      } else {
        await createParcelOrderApi(payload);
        toast.success("Parcel Created Successfully");
      }
      navigate('/dashboard/parcel-orders');
    } catch (error) {
      toast.error(error?.response?.data?.detail?.[0]?.msg || "Error processing request");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-muted text-sm animate-pulse font-bold">LOADING REGISTRY...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 p-4 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button type="button" onClick={() => navigate(-1)} className="p-1 hover:bg-primary/10 rounded-full text-text-muted hover:text-primary transition-colors">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-text-main uppercase tracking-tight">
              {isEdit ? "Update Registry" : "New Consignment"} <span className="text-primary/50 font-light">|</span> Cargo
            </h1>
          </div>
          <p className="text-xs text-primary ml-8 font-medium italic">
            {isEdit ? `Modifying Record: ${id}` : "Consignment Creation Dashboard"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sender Details */}
          <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-4 py-3 border-b border-border-subtle flex items-center gap-2">
              <User size={18} className="text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-main">Sender Details</h2>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Sender Name</label>
                  <input required value={formData.sender.name} placeholder="Name" className={inputClass} onChange={e => handleNestedChange('sender', 'name', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" size={14} />
                    <input required value={formData.sender.mobile} placeholder="Phone" className={cn(inputClass, "pl-9 font-mono")} onChange={e => handleNestedChange('sender', 'mobile', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Pickup Address</label>
                <textarea required value={formData.sender.address_line_1} rows="2" placeholder="Full Address" className={inputClass} onChange={e => handleNestedChange('sender', 'address_line_1', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={formData.sender.pincode} placeholder="Pincode" className={cn(inputClass, "font-mono")} onChange={e => handleNestedChange('sender', 'pincode', e.target.value)} />
                <input value={formData.sender.city} placeholder="City" className={inputClass} onChange={e => handleNestedChange('sender', 'city', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Receiver Details */}
          <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
            <div className="bg-orange-500/5 px-4 py-3 border-b border-border-subtle flex items-center gap-2">
              <MapPin size={18} className="text-orange-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-main">Receiver Details</h2>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Receiver Name</label>
                  <input required value={formData.receiver.name} placeholder="Name" className={inputClass} onChange={e => handleNestedChange('receiver', 'name', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" size={14} />
                    <input required value={formData.receiver.mobile} placeholder="Phone" className={cn(inputClass, "pl-9 font-mono")} onChange={e => handleNestedChange('receiver', 'mobile', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Delivery Address</label>
                <textarea required value={formData.receiver.address_line_1} rows="2" placeholder="Full Address" className={inputClass} onChange={e => handleNestedChange('receiver', 'address_line_1', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={formData.receiver.pincode} placeholder="Pincode" className={cn(inputClass, "font-mono")} onChange={e => handleNestedChange('receiver', 'pincode', e.target.value)} />
                <input value={formData.receiver.city} placeholder="City" className={inputClass} onChange={e => handleNestedChange('receiver', 'city', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing & Shipping */}
        <Card className="bg-card-bg border-border-subtle shadow-sm">
          <div className="bg-blue-500/5 px-4 py-3 border-b border-border-subtle flex items-center gap-2">
            <CreditCard size={18} className="text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-main">Pricing & Shipping</h2>
          </div>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>Payment Type</label>
              <select className={inputClass} value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                <option className={optionClass} value="Prepaid">Prepaid</option>
                <option className={optionClass} value="COD">COD</option>
                <option className={optionClass} value="To Pay">To Pay</option> 
                <option className={optionClass} value="Credit">Credit</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Freight Charge (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" size={14} />
                <input type="number" required value={formData.freight_charge} className={cn(inputClass, "pl-9 font-mono")} onChange={e => setFormData({...formData, freight_charge: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Weight (KG)</label>
              <input type="number" step="0.01" required value={formData.weight_kg} className={cn(inputClass, "font-mono")} onChange={e => setFormData({...formData, weight_kg: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Order Value (₹)</label>
              <input type="number" value={formData.order_value} className={cn(inputClass, "font-mono")} onChange={e => setFormData({...formData, order_value: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* Package Info */}
        <Card className="bg-card-bg border-border-subtle shadow-sm">
          <div className="bg-purple-500/5 px-4 py-3 border-b border-border-subtle flex items-center gap-2">
            <Package size={18} className="text-purple-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-main">Package Information</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className={labelClass}>Product Description</label>
                <input value={formData.product_name} className={inputClass} onChange={e => setFormData({...formData, product_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Qty</label>
                <input type="number" value={formData.qty} className={cn(inputClass, "font-mono")} onChange={e => setFormData({...formData, qty: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>GSTIN</label>
                <input value={formData.gst_number} className={cn(inputClass, "font-mono uppercase")} onChange={e => setFormData({...formData, gst_number: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>E-Way Bill</label>
                <input value={formData.eway_bill_number} className={cn(inputClass, "font-mono")} onChange={e => setFormData({...formData, eway_bill_number: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Insurance</label>
                <input type="number" value={formData.insurance} className={cn(inputClass, "font-mono")} onChange={e => setFormData({...formData, insurance: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className={labelClass}>Remarks</label>
                <input value={formData.remarks} className={inputClass} onChange={e => setFormData({...formData, remarks: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end">
            <Button 
                disabled={loading} 
                type="submit" 
                className={cn(
                  "w-full sm:w-auto min-w-[300px] font-bold h-12 rounded-xl shadow-lg flex items-center justify-center gap-2",
                  isEdit ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-primary hover:bg-primary/90 text-black"
                )}
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : isEdit ? <Save size={20} /> : <PlusCircle size={20} />}
                {isEdit ? "UPDATE CONSIGNMENT" : "GENERATE CONSIGNMENT"}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateParcel;