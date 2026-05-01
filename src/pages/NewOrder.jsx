import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Lock,
  ShoppingBag,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createPickupAddress } from "../redux/orderSlice";

export default function NewOrder() {
  const [orderType, setOrderType] = useState("B2C");
  const [paymentMethod, setPaymentMethod] = useState("Prepaid");
  const [products, setProducts] = useState([
    { id: 1, name: "", sku: "", price: "", qty: "", total: "" },
  ]);
  const [packages, setPackages] = useState([
    {
      id: 1,
      count: 1,
      length: "",
      breadth: "",
      height: "",
      volWeight: "",
      physicalWeight: "",
    },
  ]);

  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isConsigneeDetailsVisible, setIsConsigneeDetailsVisible] =
    useState(true);
  const [isOtherDetailsOpen, setIsOtherDetailsOpen] = useState(false);

  const dispatch = useDispatch();
  const { loading, error, selectedAddress } = useSelector(
    (state) => state.orders,
  );

  const [pickupForm, setPickupForm] = useState({
    nickname: "",
    contact_name: "",
    phone: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
  });

  const handlePickupChange = (e) => {
    const { name, value } = e.target;
    setPickupForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSavePickup = async () => {
    const promise = dispatch(createPickupAddress(pickupForm));

    toast.promise(promise, {
      loading: "Saving pickup address...",
      success: (res) => {
        if (res.meta.requestStatus === "fulfilled") {
          setIsPickupModalOpen(false);

          setPickupForm({
            nickname: "",
            contact_name: "",
            phone: "",
            email: "",
            address_line_1: "",
            address_line_2: "",
            pincode: "",
            city: "",
            state: "",
            country: "India",
          });

          return "Pickup address added successfully";
        } else {
          throw new Error("Failed");
        }
      },
      error: (err) => {
        return "Failed to save pickup address";
      },
    });
  };

  const addProduct = () => {
    setProducts([
      ...products,
      { id: Date.now(), name: "", sku: "", price: "", qty: "", total: "" },
    ]);
  };

  const removeProduct = (id) => {
    if (products.length > 1) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const addPackage = () => {
    setPackages([
      ...packages,
      {
        id: Date.now(),
        count: 1,
        length: "",
        breadth: "",
        height: "",
        volWeight: "",
        physicalWeight: "",
      },
    ]);
  };

  const removePackage = (id) => {
    if (packages.length > 1) {
      setPackages(packages.filter((p) => p.id !== id));
    }
  };

  const inputClass =
    "w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary";

  return (
    <div className="space-y-6 pb-20 relative">
      {isPickupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card-bg border border-border-subtle rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden">
            {/* HEADER */}
            <div className="flex justify-between items-center p-6 border-b border-border-subtle">
              <h2 className="text-xl font-semibold text-text-main">
                Add Pickup Address
              </h2>
              <button onClick={() => setIsPickupModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {/* FORM */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                name="nickname"
                value={pickupForm.nickname}
                onChange={handlePickupChange}
                placeholder="Address Nickname*"
                className={inputClass}
              />

              <input
                name="contact_name"
                value={pickupForm.contact_name}
                onChange={handlePickupChange}
                placeholder="Contact Name*"
                className={inputClass}
              />

              <input
                name="phone"
                value={pickupForm.phone}
                onChange={handlePickupChange}
                placeholder="Phone*"
                className={inputClass}
              />

              <input
                name="email"
                value={pickupForm.email}
                onChange={handlePickupChange}
                placeholder="Email"
                type="email"
                className={inputClass}
              />

              <input
                name="address_line_1"
                value={pickupForm.address_line_1}
                onChange={handlePickupChange}
                placeholder="Address Line 1*"
                className={inputClass}
              />

              <input
                name="address_line_2"
                value={pickupForm.address_line_2}
                onChange={handlePickupChange}
                placeholder="Address Line 2"
                className={inputClass}
              />

              <input
                name="pincode"
                value={pickupForm.pincode}
                onChange={handlePickupChange}
                placeholder="Pincode*"
                className={inputClass}
              />

              <input
                name="city"
                value={pickupForm.city}
                onChange={handlePickupChange}
                placeholder="City*"
                className={inputClass}
              />

              <input
                name="state"
                value={pickupForm.state}
                onChange={handlePickupChange}
                placeholder="State*"
                className={inputClass}
              />

              <input
                name="country"
                value={pickupForm.country}
                onChange={handlePickupChange}
                className={`${inputClass} bg-dashboard-bg`}
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="px-6 pb-2 text-red-500 text-sm">
                {Array.isArray(error) ? error[0]?.msg : error}
              </div>
            )}

            {/* FOOTER */}
            <div className="p-6 border-t border-border-subtle flex justify-end gap-4">
              <button
                onClick={() => setIsPickupModalOpen(false)}
                className="text-sm px-6 py-2.5 hover:bg-text-muted/5 rounded-lg"
              >
                Close
              </button>

              <Button
                onClick={handleSavePickup}
                disabled={loading}
                className="bg-primary text-black px-8 py-2.5 rounded-lg font-semibold"
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-text-main">New Order</h1>
        <p className="text-sm text-primary mt-1">
          <Link to="/" className="hover:underline cursor-pointer">
            Dashboard
          </Link>
          <span className="text-text-muted mx-1">&gt;&gt;</span> New Order
        </p>
      </div>
      <div className="flex items-center gap-8">
        <span className="text-sm font-medium text-text-main">Order Type *</span>
        <div className="flex items-center gap-6">
          {["B2C", "B2B", "International"].map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="orderType"
                  value={type}
                  checked={orderType === type}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    orderType === type
                      ? "border-primary"
                      : "border-text-muted/30 group-hover:border-text-muted/50",
                  )}
                />
                {orderType === type && (
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-sm text-text-main">{type}</span>
            </label>
          ))}
        </div>
      </div>
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-main">Pickup From</h2>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={
                  selectedAddress
                    ? `${selectedAddress.nickname}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`
                    : ""
                }
                readOnly
                className="w-full bg-transparent border border-primary/50 rounded-lg px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary"
              />
            </div>
            <Button
              onClick={() => setIsPickupModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-black w-12 h-12 p-0 flex items-center justify-center rounded-lg"
            >
              <Plus size={24} />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-text-main">Deliver To</h2>
            <button
              onClick={() =>
                setIsConsigneeDetailsVisible(!isConsigneeDetailsVisible)
              }
              className="text-xs font-medium text-text-main hover:underline"
            >
              {isConsigneeDetailsVisible
                ? "Hide Consignee Details"
                : "Show Consignee Details"}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search consignee by Name / Email"
              className="w-full bg-transparent border border-primary/50 rounded-lg px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          {isConsigneeDetailsVisible && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="text-sm font-semibold text-text-main">
                Consignee Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Name*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Mobile*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Alternate Mobile
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Address Line 1*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    PinCode*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    City*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    State*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-text-main">
            Payment Method
          </h2>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
            <div className="flex items-center gap-8">
              {["COD", "Prepaid", "To Pay"].map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        paymentMethod === method
                          ? "border-primary"
                          : "border-text-muted/30 group-hover:border-text-muted/50",
                      )}
                    />
                    {paymentMethod === method && (
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-sm text-text-main">{method}</span>
                </label>
              ))}
            </div>

            {paymentMethod === "To Pay" && (
              <div className="space-y-1.5 min-w-[240px] animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-xs font-medium text-text-muted">
                  To Pay Amount
                </label>
                <input
                  type="text"
                  placeholder="To Pay Amount"
                  className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {paymentMethod === "COD" && (
              <div className="space-y-1.5 min-w-[240px] animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-xs font-medium text-text-muted">
                  COD Amount
                </label>
                <input
                  type="text"
                  placeholder="COD Amount"
                  className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-text-main">
            Product Details
          </h2>

          <div className="space-y-1.5 max-w-xs">
            <label className="text-xs font-medium text-text-muted">
              Order Value *
            </label>
            <input
              type="text"
              placeholder="Total Order Value"
              className="w-full bg-dashboard-bg border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
              >
                <div className="space-y-1.5 col-span-1 md:col-span-1">
                  <label className="text-xs font-medium text-text-muted">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    SKU
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Unit Price*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    QTY*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Total*
                  </label>
                  <input
                    type="text"
                    className="w-full bg-dashboard-bg border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                    disabled
                  />
                </div>
                <div className="pb-0.5">
                  <Button
                    onClick={() => removeProduct(product.id)}
                    className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg w-full md:w-auto"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            ))}
            <Button
              onClick={addProduct}
              className="bg-primary hover:bg-primary/90 text-black flex items-center gap-2 px-6 py-2.5 rounded-lg"
            >
              <Plus size={18} />
              <span>Add New</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-text-main">
            Package Details
          </h2>

          <div className="space-y-4">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className="grid grid-cols-2 md:grid-cols-7 gap-4 items-end"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Count
                  </label>
                  <input
                    type="number"
                    defaultValue={1}
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Length (cm)*
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="w-full bg-transparent border border-border-subtle rounded-l-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                    />
                    <span className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-3 py-2.5 text-xs text-text-muted flex items-center">
                      cm
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Breadth (cm)*
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="w-full bg-transparent border border-border-subtle rounded-l-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                    />
                    <span className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-3 py-2.5 text-xs text-text-muted flex items-center">
                      cm
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Height (cm)*
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="w-full bg-transparent border border-border-subtle rounded-l-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                    />
                    <span className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-3 py-2.5 text-xs text-text-muted flex items-center">
                      cm
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Vol. Weight (Kg)*
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-l-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                      disabled
                    />
                    <span className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-3 py-2.5 text-xs text-text-muted flex items-center">
                      kg
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 whitespace-nowrap">
                    B2C Vol. Dividend (cm): 5000
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    Physical Weight (Kg)*
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="w-full bg-transparent border border-border-subtle rounded-l-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                    />
                    <span className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-3 py-2.5 text-xs text-text-muted flex items-center">
                      kg
                    </span>
                  </div>
                </div>
                <div className="pb-0.5">
                  <Button
                    onClick={() => removePackage(pkg.id)}
                    className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg w-full"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            ))}
            <Button
              onClick={addPackage}
              className="bg-primary hover:bg-primary/90 text-black flex items-center gap-2 px-6 py-2.5 rounded-lg"
            >
              <Plus size={18} />
              <span>Add New</span>
            </Button>
          </div>

          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
              <Lock size={24} />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-lg font-bold text-text-main">
                  Applicable Weight: 0.00 kg
                </p>
                <p className="text-sm text-text-main">
                  No Of Boxes * <span className="font-bold">1</span>
                </p>
              </div>
              <div className="flex items-center">
                <p className="text-sm text-text-main">
                  Total Weight: <span className="font-bold">0.00</span>{" "}
                  <span className="text-green-500">kg</span>
                </p>
              </div>
              <div className="flex items-center">
                <p className="text-sm text-text-main">
                  Total Volumetric Wt: <span className="font-bold">0.00</span>{" "}
                  <span className="text-green-500">kg</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-0">
          <button
            onClick={() => setIsOtherDetailsOpen(!isOtherDetailsOpen)}
            className="w-full flex items-center justify-between p-6 text-lg font-semibold text-text-main hover:bg-text-muted/5 transition-colors"
          >
            <span>Other Details</span>
            {isOtherDetailsOpen ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
          {isOtherDetailsOpen && (
            <div className="p-6 pt-0 border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    GST Number
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">
                    E-Way Bill Number
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button className="bg-primary hover:bg-primary/90 text-black flex items-center gap-2 px-8 py-3 rounded-lg font-semibold shadow-lg shadow-primary/20">
          <ShoppingBag size={20} />
          <span>Submit</span>
        </Button>
      </div>
    </div>
  );
}
