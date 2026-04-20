import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList, Wrench,
  CircleDollarSign, Users, Ticket, FileText, Settings,
  ChevronDown, ChevronUp, LogOut, X, ShieldCheck, Store
} from "lucide-react";
import { useDispatch } from "react-redux";
import { NavLink } from "../NavLink";
import { cn } from "../../lib/utils";
import logo from "../../assets/images/Roadoz Golden hd.png";
import { logoutUser } from "../../redux/authSlice";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";


export function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  const base = "/dashboard";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [openMenus, setOpenMenus] = useState({
    orders: false,
    tools: false,
    finance: false,
    settings: false,
    admin: false
  });

  const sections = {
    orders: [
      { name: "All Orders", to: `${base}/all-orders` },
      { name: "Manifested", to: `${base}/manifested` },
      { name: "Not Picked", to: `${base}/not-picked` },
      { name: "In Transit Orders", to: `${base}/in-transit` },
      { name: "Pending", to: `${base}/pending` },
      { name: "Out For Delivery", to: `${base}/out-for-delivery` },
      { name: "Delivered", to: `${base}/delivered` },
      { name: "RTO In Transit", to: `${base}/rto-in-transit` },
      { name: "RTO Delivered", to: `${base}/rto-delivered` },
      { name: "Returned", to: `${base}/returned` },
      { name: "Cancelled", to: `${base}/cancelled` },
    ],
    admin: [
      { name: "Module Management", to: `${base}/admin/modules` },
      { name: "Role Permissions", to: `${base}/admin/roles` },
      { name: "Staff Management", to: `${base}/admin/users` },
    ],
    tools: [
      { name: "Serviceable Pincode", to: `${base}/serviceable-pincode` },
      { name: "Rate Calculator", to: `${base}/rate-calculator` },
      { name: "Channel Integration", to: `${base}/channel-integration` },
    ],
    finance: [
      { name: "Wallet", to: `${base}/wallet` },
      { name: "COD Remittance", to: `${base}/cod-remittance` },
      { name: "Invoices", to: `${base}/invoices` },
    ],
    settings: [
      { name: "General Details", to: `${base}/settings/general` },
      { name: "Change Password", to: `${base}/settings/password` },
      { name: "Pickup Address", to: `${base}/settings/pickup` },
      { name: "RTO Address", to: `${base}/settings/rto` },
      { name: "Label Setting", to: `${base}/settings/label` },
      { name: "KYC", to: `${base}/settings/kyc` },
    ]
  };

  useEffect(() => {
    const currentPath = location.pathname;

    const activeSection = Object.keys(sections).find(key =>
      sections[key].some(item => currentPath.startsWith(item.to))
    );

    if (activeSection) {
      setOpenMenus({
        orders: false,
        tools: false,
        finance: false,
        settings: false,
        admin: false,
        [activeSection]: true
      });
    }
  }, [location.pathname]);

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      orders: false,
      tools: false,
      finance: false,
      settings: false,
      admin: false,
      [menu]: !prev[menu]
    }));
  };

  const handleLogout = async () => {
    const loadingToast = toast.loading("Logging out...");
    try {
      const response = await dispatch(logoutUser()).unwrap();

      toast.success(response.message || "Logged out successfully", { id: loadingToast });

      navigate("/login");
    } catch (error) {
      toast.error("Logged out with server error", { id: loadingToast });
      navigate("/login");
    }
  };

  const NavDropdown = ({ id, label, icon: Icon, items }) => (
    <div className="px-2 py-1">
      <button
        onClick={() => toggleMenu(id)}
        className={cn(
          "flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all",
          isOpen ? "justify-between" : "justify-center",
          openMenus[id]
            ? "bg-primary/10 text-text-main"
            : "text-text-muted hover:bg-text-muted/5"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={openMenus[id] ? "text-primary" : ""} />
          {isOpen && <span>{label}</span>}
        </div>
        {isOpen && (openMenus[id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
      </button>

      {isOpen && openMenus[id] && (
        <div className="mt-1 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
          {items.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "py-2 pl-8 pr-4 text-xs rounded-md flex items-center gap-2",
                  isActive
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-text-muted hover:bg-text-muted/5"
                )
              }
              icon={({ isActive }) => (
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isActive ? "bg-primary" : "bg-text-muted"
                  )}
                />
              )}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-screen bg-dashboard-bg border-r border-border-subtle transition-all duration-300",
        isOpen
          ? "w-64 translate-x-0"
          : "w-0 lg:w-20 -translate-x-full lg:translate-x-0"
      )}
    >
      <div className="p-4 flex items-center justify-between lg:justify-center">
        <img
          src={logo}
          alt="Logo"
          className={cn(
            "object-contain transition-all",
            isOpen ? "w-40 h-12" : "w-10 h-10"
          )}
        />
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-primary"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
        <NavLink to={base} end icon={<LayoutDashboard size={20} />} hideText={!isOpen}>
          Dashboard
        </NavLink>

        <NavLink to={`${base}/new-orders`} icon={<ShoppingCart size={20} />} hideText={!isOpen}>
          New Orders
        </NavLink>

        <NavLink to={`${base}/franchise`} icon={<Store size={20} />} hideText={!isOpen}>
          Franchise
        </NavLink>

        <NavLink to={`${base}/processing-order`} icon={<Package size={20} />} hideText={!isOpen}>
          Processing Orders
        </NavLink>

        <NavDropdown id="admin" label="Administrative" icon={ShieldCheck} items={sections.admin} />
        <NavDropdown id="orders" label="Orders" icon={ClipboardList} items={sections.orders} />
        <NavDropdown id="tools" label="Tools" icon={Wrench} items={sections.tools} />
        <NavDropdown id="finance" label="Finance" icon={CircleDollarSign} items={sections.finance} />

        <NavLink to={`${base}/consignees`} icon={<Users size={20} />} hideText={!isOpen}>
          Consignees
        </NavLink>

        <NavLink to={`${base}/tickets`} icon={<Ticket size={20} />} hideText={!isOpen}>
          Tickets
        </NavLink>

        <NavLink to={`${base}/reports`} icon={<FileText size={20} />} hideText={!isOpen}>
          Reports
        </NavLink>

        <NavDropdown id="settings" label="Settings" icon={Settings} items={sections.settings} />

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-100 w-full"
        >
          <LogOut size={20} />
          {isOpen && "Logout"}
        </button>
      </nav>
    </aside>
  );
}
