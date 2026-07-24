import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, Landmark, FileText, User, Mail, Lock } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "react-hot-toast";
import { 
  createDriverApi, 
  updateDriverApi, 
  fetchDriverByIdApi 
} from "../../services/apiCalls";

export default function DriverModal({ isOpen, onClose, onSuccess, editData }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "", 
    dob: "", 
    phone: "",
    status: "active",
    accountHolderName: "", 
    bankName: "", 
    accountNumber: "", 
    ifscOrRoutingCode: "",
    license_front: null, 
    license_back: null, 
    vehicle_insurance: null
  });

  useEffect(() => {
    if (isOpen) {
      if (editData?.id) {
        loadFullDetails(editData.id);
      } else {
        setFormData({
          firstName: "", lastName: "", email: "", password: "", dob: "", phone: "",
          status: "active", accountHolderName: "", bankName: "", accountNumber: "", 
          ifscOrRoutingCode: "", license_front: null, license_back: null, vehicle_insurance: null
        });
      }
    }
  }, [isOpen, editData]);

  const loadFullDetails = async (id) => {
    setFetching(true);
    try {
      const data = await fetchDriverByIdApi(id);
      setFormData({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        password: "", // Usually don't pre-fill password for security
        dob: data.dob || "",
        phone: data.phone || "",
        status: data.status || "active",
        accountHolderName: data.payout_account?.account_holder_name || "",
        bankName: data.payout_account?.bank_name || "",
        accountNumber: data.payout_account?.account_number || "",
        ifscOrRoutingCode: data.payout_account?.ifsc_or_routing_code || "",
        license_front: null,
        license_back: null,
        vehicle_insurance: null
      });
    } catch (err) {
      toast.error("Failed to load full driver details");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple Validation
    if (!formData.email.includes("@")) {
      return toast.error("Please enter a valid email address");
    }
    if (!editData && formData.password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    setLoading(true);

    try {
      // Use FormData to support file uploads correctly
      const data = new FormData();
      data.append("first_name", formData.firstName);
      data.append("last_name", formData.lastName);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("dob", formData.dob);
      data.append("status", formData.status);
      
      // Only append password if it's a new driver or if updating password
      if (formData.password) {
        data.append("password", formData.password);
      }

      // Banking
      data.append("account_holder_name", formData.accountHolderName);
      data.append("bank_name", formData.bankName);
      data.append("account_number", formData.accountNumber);
      data.append("ifsc_or_routing_code", formData.ifscOrRoutingCode);

      // Files
      if (formData.license_front) data.append("license_front", formData.license_front);
      if (formData.license_back) data.append("license_back", formData.license_back);
      if (formData.vehicle_insurance) data.append("vehicle_insurance", formData.vehicle_insurance);

      if (editData) {
        await updateDriverApi(editData.id, data);
        toast.success("Driver updated successfully");
      } else {
        await createDriverApi(data);
        toast.success("Driver registered successfully");
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.detail?.[0]?.msg || (editData ? "Update failed" : "Registration failed");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card-bg border border-border-subtle w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/30">
          <div>
            <h2 className="text-xl font-black text-text-main uppercase tracking-tight">
              {editData ? "Edit Personnel File" : "New Driver Registration"}
            </h2>
            <p className="text-[10px] text-primary font-bold tracking-widest uppercase">Fleet Management System</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-8 custom-scrollbar">
          {fetching ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Syncing with Registry...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* BASIC INFO */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <User size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Basic Information</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="First Name" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
                  <FormInput label="Last Name" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
                  
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <FormInput 
                      label="Email Address" 
                      type="email" 
                      value={formData.email} 
                      onChange={v => setFormData({...formData, email: v})} 
                    />
                    <FormInput 
                      label={editData ? "New Password (Optional)" : "Password (Min 8 characters)"} 
                      type="password" 
                      value={formData.password} 
                      onChange={v => setFormData({...formData, password: v})} 
                    />
                  </div>

                  <FormInput label="Phone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
                  <FormInput label="Date of Birth" type="date" value={formData.dob} onChange={v => setFormData({...formData, dob: v})} />
                  
                  {editData && (
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase ml-1">Account Status</label>
                      <select 
                        className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary mt-1"
                        value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  )}
                </div>
              </section>

              {/* BANKING INFO */}
              <section className="space-y-4 p-6 bg-dashboard-bg/40 border border-border-subtle rounded-2xl">
                <div className="flex items-center gap-2 text-primary">
                  <Landmark size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Banking & Payouts</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <FormInput label="Account Holder Name" value={formData.accountHolderName} onChange={v => setFormData({...formData, accountHolderName: v})} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Bank Name" value={formData.bankName} onChange={v => setFormData({...formData, bankName: v})} />
                    <FormInput label="IFSC / Routing Code" value={formData.ifscOrRoutingCode} onChange={v => setFormData({...formData, ifscOrRoutingCode: v})} />
                  </div>
                  <FormInput label="Account Number" value={formData.accountNumber} onChange={v => setFormData({...formData, accountNumber: v})} />
                </div>
              </section>

              {/* DOCUMENTS */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <FileText size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Verification Documents</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {['license_front', 'license_back', 'vehicle_insurance'].map(field => (
                    <div key={field} className="flex items-center justify-between p-4 bg-dashboard-bg/20 border border-dashed border-border-subtle rounded-2xl group hover:border-primary transition-all">
                      <div>
                        <p className="text-[11px] font-bold text-text-main uppercase">{field.replace(/_/g, ' ')}</p>
                        <p className="text-[9px] text-text-muted uppercase">
                          {formData[field] ? formData[field].name : (editData ? "Keep existing or upload new" : "No file selected")}
                        </p>
                      </div>
                      <label className="cursor-pointer bg-primary/10 text-primary px-4 py-2 rounded-lg text-[10px] font-black hover:bg-primary hover:text-black transition-all">
                        {formData[field] ? "CHANGE" : "UPLOAD"}
                        <input type="file" className="hidden" onChange={e => setFormData({...formData, [field]: e.target.files[0]})} />
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <Button type="submit" disabled={loading} className="w-full bg-primary text-black font-black h-14 rounded-2xl shadow-lg hover:shadow-primary/30 transition-all uppercase tracking-widest">
                {loading ? <Loader2 className="animate-spin" /> : editData ? "Update Driver Record" : "Register New Driver"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, type = "text", value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-text-muted uppercase ml-1">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        required={type !== "password" || !value} // Basic requirement check
        className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary transition-all" 
      />
    </div>
  );
}