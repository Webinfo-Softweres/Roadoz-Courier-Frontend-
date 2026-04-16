import React, { useState } from "react";
import { Edit, Trash2, Search, Eye, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import AddStaffForm from "./AddStaffForm";
import CommonModal from "./CommonModal"; // Ensure you import your Modal component

export default function TransactionManager() {
    const [view, setView] = useState("list");
    const [selectedStaff, setSelectedStaff] = useState(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingStaff, setViewingStaff] = useState(null);

    const [staffList] = useState([
        {
            id: 1,
            name: "Akshay Kumar",
            email: "akshay@gl.com",
            role: "Manager",
            fCode: "FRN-2024-001",
            status: true,
            permissions: ["List Users", "Create User", "Update User", "View Franchise", "Edit Franchise"]
        },
        {
            id: 2,
            name: "Rahul Sharma",
            email: "rahul@gl.com",
            role: "Supervisor",
            fCode: "FRN-2024-002",
            status: true,
            permissions: ["List Users", "View Franchise"]
        }
    ]);

    const handleEdit = (staff) => {
        setSelectedStaff(staff);
        setView("form");
    };

    const handleViewPermissions = (staff) => {
        setViewingStaff(staff);
        setIsViewModalOpen(true);
    };

    if (view === "form") {
        return (
            <AddStaffForm
                initialData={selectedStaff}
                onCancel={() => setView("list")}
                onSuccess={() => setView("list")}
            />
        );
    }

    return (
        <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
            <CardContent className="p-0">
                <div className="p-6 bg-dashboard-bg/30 border-b border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff by name or code..."
                            className="w-full bg-card-bg border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-sm text-text-main focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                                <th className="px-6 py-4">Staff Details</th>
                                <th className="px-6 py-4">Franchise Code</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {staffList.map((staff) => (
                                <tr key={staff.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm text-text-main">{staff.name}</div>
                                        <div className="text-[11px] text-text-muted">{staff.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded font-mono font-bold text-xs">
                                            {staff.fCode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded border border-blue-500/20 uppercase">
                                            {staff.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleViewPermissions(staff)}
                                                title="View Permissions"
                                                className="p-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded-md shadow-sm transition-colors"
                                            >
                                                <Eye size={14} />
                                            </button>

                                            <button
                                                onClick={() => handleEdit(staff)}
                                                className="p-1.5 border border-primary/20 text-primary rounded hover:bg-primary/10 transition-all"
                                            >
                                                <Edit size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            {/* --- PERMISSION VIEWER MODAL --- */}
            <CommonModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Access Permissions: ${viewingStaff?.name || ""}`}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {viewingStaff?.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-text-main leading-tight">{viewingStaff?.name}</p>
                            <p className="text-xs text-text-muted">{viewingStaff?.role} | {viewingStaff?.fCode}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                        {viewingStaff?.permissions?.length > 0 ? (
                            viewingStaff.permissions.map((perm, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 p-3 bg-white/5 border border-border-subtle rounded-lg group hover:border-primary/40 transition-all">
                                    <CheckCircle2 size={16} className="text-primary opacity-70" />
                                    <span className="text-xs text-text-main font-medium uppercase tracking-tight">{perm}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-text-muted italic py-4">No specific permissions assigned.</p>
                        )}
                    </div>
                </div>
            </CommonModal>
        </Card>
    );
}