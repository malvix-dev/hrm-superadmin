import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/form/FormSelect";
import { Building2, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const COUNTRIES = [
  { label: "Pakistan", value: "Pakistan" },
  { label: "India", value: "India" },
  { label: "UAE", value: "UAE" },
  { label: "Saudi Arabia", value: "Saudi Arabia" },
  { label: "United Kingdom", value: "United Kingdom" },
];

const STATES: Record<string, { label: string; value: string }[]> = {
  Pakistan: [
    { label: "Punjab", value: "Punjab" },
    { label: "Sindh", value: "Sindh" },
    { label: "KPK", value: "KPK" },
    { label: "Balochistan", value: "Balochistan" },
    { label: "Islamabad", value: "Islamabad" },
  ],
  India: [
    { label: "Maharashtra", value: "Maharashtra" },
    { label: "Delhi", value: "Delhi" },
    { label: "Karnataka", value: "Karnataka" },
    { label: "Tamil Nadu", value: "Tamil Nadu" },
    { label: "Gujarat", value: "Gujarat" },
  ],
  UAE: [
    { label: "Dubai", value: "Dubai" },
    { label: "Abu Dhabi", value: "Abu Dhabi" },
    { label: "Sharjah", value: "Sharjah" },
    { label: "Ajman", value: "Ajman" },
    { label: "Fujairah", value: "Fujairah" },
  ],
  "Saudi Arabia": [
    { label: "Riyadh", value: "Riyadh" },
    { label: "Makkah", value: "Makkah" },
    { label: "Madinah", value: "Madinah" },
    { label: "Jeddah", value: "Jeddah" },
    { label: "Dammam", value: "Dammam" },
  ],
  "United Kingdom": [
    { label: "England", value: "England" },
    { label: "Scotland", value: "Scotland" },
    { label: "Wales", value: "Wales" },
    { label: "Northern Ireland", value: "Northern Ireland" },
    { label: "London", value: "London" },
  ],
};

const CITIES: Record<string, { label: string; value: string }[]> = {
  Punjab: [
    { label: "Lahore", value: "Lahore" },
    { label: "Faisalabad", value: "Faisalabad" },
    { label: "Rawalpindi", value: "Rawalpindi" },
    { label: "Multan", value: "Multan" },
    { label: "Gujranwala", value: "Gujranwala" },
  ],
  Sindh: [
    { label: "Karachi", value: "Karachi" },
    { label: "Hyderabad", value: "Hyderabad" },
    { label: "Sukkur", value: "Sukkur" },
    { label: "Larkana", value: "Larkana" },
    { label: "Nawabshah", value: "Nawabshah" },
  ],
  Maharashtra: [
    { label: "Mumbai", value: "Mumbai" },
    { label: "Pune", value: "Pune" },
    { label: "Nagpur", value: "Nagpur" },
    { label: "Nashik", value: "Nashik" },
    { label: "Aurangabad", value: "Aurangabad" },
  ],
  Dubai: [
    { label: "Dubai City", value: "Dubai City" },
    { label: "Deira", value: "Deira" },
    { label: "Jumeirah", value: "Jumeirah" },
    { label: "Marina", value: "Marina" },
    { label: "Downtown", value: "Downtown" },
  ],
  Riyadh: [
    { label: "Riyadh City", value: "Riyadh City" },
    { label: "Al Kharj", value: "Al Kharj" },
    { label: "Diriyah", value: "Diriyah" },
    { label: "Al Majmaah", value: "Al Majmaah" },
    { label: "Wadi Al Dawasir", value: "Wadi Al Dawasir" },
  ],
  England: [
    { label: "London", value: "London" },
    { label: "Manchester", value: "Manchester" },
    { label: "Birmingham", value: "Birmingham" },
    { label: "Liverpool", value: "Liverpool" },
    { label: "Leeds", value: "Leeds" },
  ],
};

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "", state: "", city: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "country") { next.state = ""; next.city = ""; }
      if (field === "state") { next.city = ""; }
      return next;
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Account created! Please verify your email.");
      navigate("/verify-otp", { state: { email: form.email } });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative flex-col justify-between p-8 md:p-12">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
          </div>
          <h1 className="text-primary-foreground font-bold text-lg md:text-xl">Hostel Manager</h1>
        </div>
        <div>
          <h2 className="text-primary-foreground text-3xl md:text-4xl font-bold leading-tight mb-3 md:mb-4">
            Start managing<br />your hostels today
          </h2>
          <p className="text-primary-foreground/70 text-base md:text-lg max-w-md">
            Create your account and get access to a 14-day free trial. No credit card required.
          </p>
        </div>
        <p className="text-primary-foreground/50 text-xs md:text-sm">© 2026 Hostel Manager. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <h1 className="text-foreground font-bold text-base md:text-lg">Hostel Manager</h1>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">Create your account</h2>
          <p className="text-muted-foreground text-xs md:text-sm mb-6 md:mb-8">Start your 14-day free trial</p>

          <form onSubmit={handleSignup} className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" className="pl-8 md:pl-10 h-9 md:h-10 text-xs md:text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" className="pl-8 md:pl-10 h-9 md:h-10 text-xs md:text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+92 300 1234567" className="pl-8 md:pl-10 h-9 md:h-10 text-xs md:text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <FormSelect
                label="Country"
                value={form.country}
                onValueChange={(v) => update("country", v)}
                options={COUNTRIES}
                searchable
                placeholder="Select country"
              />
              <FormSelect
                label="State / Province"
                value={form.state}
                onValueChange={(v) => update("state", v)}
                options={form.country ? (STATES[form.country] || []) : []}
                searchable
                placeholder="Select state"
                disabled={!form.country}
              />
            </div>

            <FormSelect
              label="City"
              value={form.city}
              onValueChange={(v) => update("city", v)}
              options={form.state ? (CITIES[form.state] || []) : []}
              searchable
              placeholder="Select city"
              disabled={!form.state}
            />

            <div>
              <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min 6 characters"
                  className="pl-8 md:pl-10 pr-9 md:pr-10 h-9 md:h-10 text-xs md:text-sm"
                />
                <button type="button" className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  className="pl-8 md:pl-10 pr-9 md:pr-10 h-9 md:h-10 text-xs md:text-sm"
                />
                <button type="button" className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-9 md:h-10 text-xs md:text-sm" disabled={loading}>
              {loading ? "Creating account..." : <>Create Account <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1 md:ml-1.5" /></>}
            </Button>
          </form>

          <p className="text-center text-xs md:text-sm text-muted-foreground mt-4 md:mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
