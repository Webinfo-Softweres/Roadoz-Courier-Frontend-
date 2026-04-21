import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProfile,
  updateProfile,
  uploadProfileImage,
} from "../redux/profileSlice";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  Lock,
  ChevronRight,
  X,
  RotateCcw,
  Save,
  Map,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BackButton } from "../components/ui/BackButton";
import { AnimatePresence, motion } from "framer-motion";
import { Loader } from "../components/ui/Loader";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import VerifyOtpModal from "../components/modals/VerifyOtpModal";

const IMAGE_SERVER_URL = "http://api.roadozcourier.com";

export function Profile() {
  const dispatch = useDispatch();

  const { user, loading } = useSelector((state) => state.profile);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    location: "",
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        location: user.location || "",
      });
    }
  }, [user, isEditModalOpen]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);

    try {
      await dispatch(uploadProfileImage(data)).unwrap();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // const getFinalImageUrl = () => {
  //   const path = user?.profile_image;
  //   console.log("yyyyyyyyyyyyyy", path);

  //   if (!path) return null;

  //   if (path.startsWith("http")) return path;

  //   if (path.startsWith("/uploads")) {
  //     return `${IMAGE_SERVER_URL}${path}`;
  //   }

  //   return `${IMAGE_SERVER_URL}/${path}`;
  // };

  // const PLACEHOLDER_IMAGE = `https://ui-avatars.com/api/?name=${
  //   user?.name || "User"
  // }&background=0D8ABC&color=fff`;

  // const getFinalImageUrl = () => {
  //   const path = user?.profile_image;

  //   // ❌ No image
  //   if (!path) return PLACEHOLDER_IMAGE;

  //   // 🚨 BLOCK API endpoints (THIS IS YOUR MAIN ISSUE)
  //   if (path.includes("/api/")) return PLACEHOLDER_IMAGE;

  //   // ✅ Full URL
  //   if (path.startsWith("http")) return path;

  //   // ✅ Valid uploaded image
  //   if (path.startsWith("/uploads")) {
  //     return `${IMAGE_SERVER_URL}${path}`;
  //   }

  //   // ❌ Anything else → fallback
  //   return PLACEHOLDER_IMAGE;
  // };

  const PLACEHOLDER_IMAGE = `https://ui-avatars.com/api/?name=${
    user?.name || "User"
  }`;

  const getImage = () => {
    const img = user?.profile_image;

    if (!img || img.includes("/api/")) {
      return PLACEHOLDER_IMAGE;
    }

    return `http://api.roadozcourier.com${img}`;
  };

  if (loading && !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  if (!user) return null;

  return (
    <div className="space-y-6 pb-10 px-4 md:px-0">
      <BackButton />

      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-text-main">Profile</h1>
        <p className="text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline">
            Dashboard
          </Link>
          <span className="text-text-muted mx-1">&gt;&gt;</span>
          Profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="bg-card-bg border-none shadow-sm overflow-hidden sticky top-24">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20 relative shadow-inner">
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[2px]">
                      <Loader2
                        className="text-primary animate-spin"
                        size={28}
                      />
                    </div>
                  )}

                  {/* {getFinalImageUrl() ? (
                    // <img
                    //   src={getFinalImageUrl()}
                    //   alt="User Profile"
                    //   className="w-full h-full object-cover"
                    //   key={user.profile_image}
                    //   onError={(e) => {
                    //     e.target.onerror = null;
                    //     e.target.src = "";
                    //   }}
                    // />
                    // <img
                    //   src={getFinalImageUrl()}
                    //   alt="User Profile"
                    //   className="w-full h-full object-cover"
                    //   key={user.profile_image}
                    //   onError={(e) => {
                    //     e.currentTarget.onerror = null;
                    //     e.currentTarget.src = PLACEHOLDER_IMAGE;
                    //   }}
                    // />
                    <img
                      src={getImage()}
                      alt="User"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  ) : (
                    <User size={64} className="text-primary opacity-40" />
                  )} */}
                  <img
                    src={getImage()}
                    alt="User Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={isUploading}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-black rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all border-4 border-card-bg"
                  title="Change Profile Photo"
                >
                  <Camera size={18} />
                </button>
              </div>

              <h2 className="text-xl font-bold text-text-main mb-1 capitalize">
                {user.name}
              </h2>
              <p className="text-[10px] text-primary font-bold mb-6 uppercase tracking-[0.2em]">
                {user.role?.replace("_", " ")}
              </p>

              <div className="w-full h-px bg-border-subtle mb-6"></div>

              <div className="w-full space-y-4">
                <div className="flex items-center justify-center gap-3 text-sm text-text-muted">
                  <Mail size={16} className="text-primary" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 py-2 rounded-lg">
                  <BadgeCheck size={16} />
                  <span>ACCOUNT VERIFIED</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <Card className="bg-card-bg border-none shadow-sm">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">
                Profile Information
              </h3>
              <Button
                className="bg-primary text-black hover:bg-primary/90 font-bold h-9 px-6 text-xs uppercase"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </Button>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem
                  label="Full Name"
                  value={user.name}
                  icon={<User size={18} />}
                />
                <InfoItem
                  label="Email Address"
                  value={user.email}
                  icon={<Mail size={18} />}
                />
                <InfoItem
                  label="Contact Number"
                  value={user.phone}
                  icon={<Phone size={18} />}
                />
                <InfoItem
                  label="Location"
                  value={user.location}
                  icon={<MapPin size={18} />}
                />
                <div className="md:col-span-2">
                  <InfoItem
                    label="Address"
                    value={user.address}
                    icon={<Map size={18} />}
                  />
                </div>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <SecurityCard
                  icon={<Lock size={20} />}
                  title="Security"
                  desc="Manage account password"
                  onClick={() => setIsPasswordModalOpen(true)}
                />
                <SecurityCard
                  icon={<BadgeCheck size={20} />}
                  title="Status"
                  desc="Active Super Admin"
                  isGreen
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border-subtle flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-dashboard-bg/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <User className="text-primary" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-text-main">
                    Update Details
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-text-muted hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto bg-card-bg custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ModalInput
                    label="Full Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    icon={<User size={18} />}
                  />
                  <ModalInput
                    label="Contact Number *"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    icon={<Phone size={18} />}
                  />
                  <div className="md:col-span-2">
                    <ModalInput
                      label="Location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      icon={<MapPin size={18} />}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-1">
                      Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-4 text-text-muted opacity-50">
                        <Map size={18} />
                      </div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-border-subtle bg-dashboard-bg/50">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={14} /> Cancel
                </button>
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="bg-primary text-black h-11 px-10 font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPasswordModalOpen && (
          <ChangePasswordModal
            onClose={() => setIsPasswordModalOpen(false)}
            onSuccess={(password) => {
              setNewPassword(password);
              setIsPasswordModalOpen(false);
              setIsOtpModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOtpModalOpen && (
          <VerifyOtpModal
            onClose={() => setIsOtpModalOpen(false)}
            newPassword={newPassword}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50">
          {icon}
        </div>
        <div className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-text-main/80 min-h-[48px] flex items-center capitalize">
          {value || "Not provided"}
        </div>
      </div>
    </div>
  );
}

function ModalInput({ label, name, value, onChange, icon }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50">
          {icon}
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  );
}

function SecurityCard({ icon, title, desc, isGreen, onClick }) {
  return (
    <div className="p-6 rounded-2xl border border-border-subtle bg-dashboard-bg/50 flex flex-col">
      <div className={isGreen ? "text-green-500 mb-4" : "text-primary mb-4"}>
        {icon}
      </div>
      <h5 className="font-bold text-text-main text-sm">{title}</h5>
      <p className="text-xs text-text-muted mt-1 mb-4">{desc}</p>

      <button
        onClick={onClick}
        className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
      >
        Update <ChevronRight size={12} />
      </button>
    </div>
  );
}
