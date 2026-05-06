import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, Plus, X, RotateCcw, Edit, Trash2 } from "lucide-react";
import Pagination from "../components/ui/Pagination";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createConsignee,
  fetchConsignees,
  updateConsignee,
  deleteConsignee,
} from "../redux/consigneeSlice";

export function Consignees() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsignee, setEditingConsignee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    pincode: "",
    city: "",
    state: "",
  });

  const [filters, setFilters] = useState({
    name: "",
    mobile: "",
    email: "",
    limit: 25,
    page: 1,
  });

  const dispatch = useDispatch();

  const { consignees, loading } = useSelector((state) => state.consignees);

  useEffect(() => {
    dispatch(
      fetchConsignees({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
      }),
    );
  }, [dispatch, filters]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters({
      ...filters,
      [name]: name === "limit" ? Number(value) : value,
    });
  };

  const handleSearch = () => {
    const search = filters.name || filters.mobile || filters.email || "";

    dispatch(
      fetchConsignees({
        page: filters.page,
        limit: filters.limit,
        search,
      }),
    );
  };
  
  const clearFilters = () => {
    setFilters({
      search: "",
      limit: 25,
      page: 1,
    });

    dispatch(
      fetchConsignees({
        page: 1,
        limit: 25,
        search: "",
      }),
    );
  };

  const handleSaveConsignee = async () => {
    try {
      if (editingConsignee) {
        await dispatch(
          updateConsignee({
            id: editingConsignee.id,
            data: formData,
          }),
        ).unwrap();
      } else {
        await dispatch(createConsignee(formData)).unwrap();
      }

      setFormData({
        name: "",
        mobile: "",
        alternate_mobile: "",
        email: "",
        address_line_1: "",
        address_line_2: "",
        pincode: "",
        city: "",
        state: "",
      });

      setEditingConsignee(null);

      setIsModalOpen(false);

      dispatch(fetchConsignees());
    } catch (error) {
      console.log(error);
    }
  };

  const toggleStatus = () => {};

  const handleEdit = (consignee) => {
    setEditingConsignee(consignee);

    setFormData({
      name: consignee.name || "",
      mobile: consignee.mobile || "",
      alternate_mobile: consignee.alternate_mobile || "",
      email: consignee.email || "",
      address_line_1: consignee.address_line_1 || "",
      address_line_2: consignee.address_line_2 || "",
      pincode: consignee.pincode || "",
      city: consignee.city || "",
      state: consignee.state || "",
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteConsignee(id)).unwrap();
      dispatch(fetchConsignees());
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Consignee</h1>
        <p className="text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline cursor-pointer">
            Dashboard
          </Link>
          <span className="text-text-muted mx-1">&gt;&gt;</span> Consignee
        </p>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-main">
              Consignee List
            </h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-black h-9 px-4 text-xs font-bold rounded-md flex items-center gap-2"
              >
                <Plus size={14} /> Add New
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-black h-9 px-4 text-xs font-bold rounded-md flex items-center gap-2">
                <Download size={14} /> Export
              </Button>
            </div>
          </div>

          <div className="p-6 bg-dashboard-bg/30 border-b border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Date Range
                </label>

                <input
                  type="text"
                  placeholder="Date Range"
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Name"
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Mobile No
                </label>

                <input
                  type="text"
                  name="mobile"
                  value={filters.mobile}
                  onChange={handleFilterChange}
                  placeholder="Mobile No"
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  value={filters.email}
                  onChange={handleFilterChange}
                  placeholder="Email"
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Pincode
                </label>

                <input
                  type="text"
                  placeholder="Pincode"
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Status:
                </label>

                <select className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary appearance-none">
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div className="w-24 space-y-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Limit:
                </label>

                <input
                  type="number"
                  name="limit"
                  min="1"
                  max="100"
                  value={filters.limit}
                  onChange={handleFilterChange}
                  placeholder="Limit"
                  className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  className="bg-primary hover:bg-primary/90 text-black h-9 px-8 text-xs font-bold rounded-md"
                >
                  Search
                </Button>

                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <RotateCcw size={14} /> Clear Filters
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-visible pb-3 custom-scrollbar">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-dashboard-bg/50 border-y border-border-subtle sticky top-0 z-10">
                <tr className="text-text-muted text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                  <th className="px-4 py-3 min-w-[90px]">Id</th>
                  <th className="px-4 py-3 min-w-[160px]">Name</th>
                  <th className="px-4 py-3 min-w-[230px]">Contact</th>
                  <th className="px-4 py-3 min-w-[220px]">Address 1</th>
                  <th className="px-4 py-3 min-w-[220px]">Address 2</th>
                  <th className="px-4 py-3 min-w-[100px]">Pincode</th>
                  <th className="px-4 py-3 min-w-[120px]">City</th>
                  <th className="px-4 py-3 min-w-[140px]">State</th>
                  <th className="px-4 py-3 text-center min-w-[100px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle">
                {consignees.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-dashboard-bg/30 transition-colors"
                  >
                    <td className="px-4 py-4 text-xs text-text-main font-medium whitespace-nowrap">
                      #{c.id?.slice(0, 8)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-text-main">
                          {c.name}
                        </span>

                        {c.alternate_mobile && (
                          <span className="text-[11px] text-text-muted mt-1">
                            Alt: {c.alternate_mobile}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-text-main">
                          {c.mobile}
                        </span>

                        <span className="text-xs text-text-muted break-all">
                          {c.email || "No Email"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-text-muted leading-5">
                      {c.address_line_1 || "-"}
                    </td>

                    <td className="px-4 py-4 text-xs text-text-muted leading-5">
                      {c.address_line_2 || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-text-main">
                      {c.pincode}
                    </td>

                    <td className="px-4 py-4 text-sm text-text-main">
                      {c.city}
                    </td>

                    <td className="px-4 py-4 text-sm text-text-main">
                      {c.state}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => toggleStatus(c.id)}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none",
                            c.status
                              ? "bg-green-500"
                              : "bg-dashboard-bg border border-border-subtle",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                              c.status ? "translate-x-5" : "translate-x-1",
                            )}
                          />
                        </button>

                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase",
                            c.status ? "text-green-500" : "text-text-muted",
                          )}
                        >
                          {c.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all duration-200"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card-bg rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border-subtle"
            >
              <div className="flex items-center justify-between p-5 border-b border-border-subtle">
                <h3 className="text-lg font-bold text-text-main">
                  {editingConsignee ? "Edit Consignee" : "Add New Consignee"}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingConsignee(null);
                  }}
                  className="p-2 hover:bg-dashboard-bg rounded-full transition-colors text-text-muted"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar bg-card-bg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Mobile No *
                    </label>

                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="Mobile No"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Alternate Mobile
                    </label>

                    <input
                      type="text"
                      name="alternate_mobile"
                      value={formData.alternate_mobile}
                      onChange={handleChange}
                      placeholder="Alternate Mobile"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Email Address
                    </label>

                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Address Line 1 *
                    </label>

                    <input
                      type="text"
                      name="address_line_1"
                      value={formData.address_line_1}
                      onChange={handleChange}
                      placeholder="Address 1"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Address Line 2
                    </label>

                    <input
                      type="text"
                      name="address_line_2"
                      value={formData.address_line_2}
                      onChange={handleChange}
                      placeholder="Address 2"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Pincode *
                    </label>

                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      State
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="status"
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                    defaultChecked
                  />
                  <label
                    htmlFor="status"
                    className="text-sm font-bold text-text-main cursor-pointer"
                  >
                    Active Consignee
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-border-subtle bg-dashboard-bg/50">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingConsignee(null);
                  }}
                  className="px-6 py-2 text-sm font-bold text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleSaveConsignee}
                  disabled={loading}
                  className="bg-primary text-black h-10 px-10 font-bold shadow-md"
                >
                  Save Consignee
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
