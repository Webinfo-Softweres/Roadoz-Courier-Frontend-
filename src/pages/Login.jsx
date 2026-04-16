import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Hash, ShieldCheck } from "lucide-react";
import Logo from "../assets/images/Roadoz Golden hd.png";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function Login() {
  const navigate = useNavigate();


  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "testuser@gmail.com",
    password: "password123",
    franchiseCode: "sree@679339"
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFirstStep = (e) => {
    e.preventDefault();
    setLoading(true);


    setTimeout(() => {
      setLoading(false);
      if (formData.email === "admin@roadoz.com") {
        localStorage.setItem("isAuth", "true");
        navigate("/dashboard");
      } else {
        setStep(2);
      }
    }, 1000);
  };

  const handleFinalStep = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("isAuth", "true");
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-dashboard-bg flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="mb-10 text-center">
        <img src={Logo} alt="Roadoz Logo" className="h-16 w-auto mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-bold text-text-main tracking-tight italic">
          ROADOZ <span className="text-primary not-italic tracking-normal ml-1">LOGISTICS</span>
        </h1>
      </div>

      <div className="w-full max-w-[450px] bg-card-bg rounded-2xl border border-border-subtle shadow-2xl overflow-hidden relative">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="p-8 md:p-10"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-text-main mb-2">Sign In</h2>
                <p className="text-text-muted font-medium italic">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleFirstStep} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-4 py-4 text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Password</label>
                    <Link to="/forgot-password" size="sm" className="text-primary text-xs font-bold hover:underline">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-12 py-4 text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-primary">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-primary text-black font-bold py-7 rounded-xl shadow-lg hover:bg-primary/90 text-base uppercase tracking-widest">
                  {loading ? "Authenticating..." : "Continue"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="p-8 md:p-10"
            >
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-6 hover:opacity-80 transition-opacity"
              >
                <ArrowLeft size={16} /> Back to login
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="text-primary" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-text-main mb-2">Franchise Verification</h2>
                <p className="text-text-muted text-sm italic px-4">Please enter your unique Franchise ID to access your dashboard.</p>
              </div>

              <form onSubmit={handleFinalStep} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Franchise Code</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                      type="text"
                      name="franchiseCode"
                      value={formData.franchiseCode}
                      onChange={handleInputChange}
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-4 py-4 text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-muted"
                      placeholder="Enter 6-digit code"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-primary text-black font-bold py-7 rounded-xl shadow-lg hover:bg-primary/90 text-base uppercase tracking-widest">
                  {loading ? "Verifying..." : "Verify & Enter"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-8 text-text-muted text-xs font-bold uppercase tracking-widest opacity-50">
        © 2026 Roadoz Logistics. All rights reserved.
      </p>
    </div>
  );
}