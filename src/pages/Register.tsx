import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2, User, Mail, Lock, Globe, Phone, MapPin, Briefcase,
  Users, Eye, EyeOff, CheckCircle, Clock, ChevronRight, ChevronLeft,
  ArrowRight, BadgeCheck,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL ?? "http://localhost:8080";

// ── Constants ─────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Trading / Forex",
  "Manufacturing",
  "Retail / E-commerce",
  "Information Technology",
  "Finance / Banking",
  "Healthcare",
  "Construction / Real Estate",
  "Education",
  "Hospitality / Hotels",
  "Logistics / Transport",
  "Telecom",
  "Other",
];

const EMPLOYEE_RANGES = [
  "1 – 10",
  "11 – 50",
  "51 – 200",
  "201 – 500",
  "501 – 1,000",
  "1,000+",
];

const COUNTRIES = [
  "Pakistan", "India", "UAE", "Saudi Arabia", "Qatar", "Kuwait",
  "Bahrain", "Oman", "United Kingdom", "United States", "Canada",
  "Australia", "Germany", "France", "Other",
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxBranches: number;
  maxEmployees: number;
  maxStaff: number;
  features: string[];
}

type Step = 1 | 2 | 3;

interface FormState {
  planId: string;
  orgName: string;
  companyEmail: string;
  companyPhone: string;
  website: string;
  city: string;
  country: string;
  industry: string;
  employeeRange: string;
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function normalizeWebsite(v: string): string {
  const s = v.trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

// ── Step indicators ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1 as Step, label: "Choose Plan" },
  { n: 2 as Step, label: "Company Info" },
  { n: 3 as Step, label: "Your Account" },
];

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, selected, onSelect }: { plan: Plan; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base">{plan.name}</h3>
            {selected && <BadgeCheck className="w-4 h-4 text-primary" />}
          </div>
          {plan.description && (
            <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
          )}
          <div className="space-y-1.5">
            {[
              `Up to ${plan.maxBranches} branch${plan.maxBranches !== 1 ? "es" : ""}`,
              `Up to ${plan.maxEmployees} employees`,
              `Up to ${plan.maxStaff} staff accounts`,
              ...plan.features,
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-foreground">
            Rs {plan.priceMonthly.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">per month</p>
          {plan.priceYearly > 0 && (
            <p className="text-xs text-green-600 mt-1">
              Rs {plan.priceYearly.toLocaleString()}/yr
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm mb-1.5 block">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Register() {
  const [step, setStep] = useState<Step>(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState<FormState>({
    planId: "",
    orgName: "", companyEmail: "", companyPhone: "", website: "", city: "", country: "Pakistan", industry: "", employeeRange: "",
    ownerName: "", email: "", password: "", confirmPassword: "",
  });

  const set = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/public/plans`);
      return res.json();
    },
  });

  const selectedPlan = plans.find(p => p.id === form.planId) ?? (plans.length === 1 ? plans[0] : null);
  if (plans.length === 1 && !form.planId && plans[0]) {
    setForm(f => ({ ...f, planId: plans[0].id }));
  }

  // ── Validation per step — returns field-level errors ──────────────────────

  const validateStep = (s: Step): FieldErrors => {
    const errs: FieldErrors = {};
    if (s === 1) {
      if (!form.planId) errs.planId = "Please select a plan to continue.";
    }
    if (s === 2) {
      if (!form.orgName.trim()) errs.orgName = "Company name is required.";
      if (!form.companyEmail.trim()) {
        errs.companyEmail = "Company email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail)) {
        errs.companyEmail = "Enter a valid email address.";
      }
      if (form.website.trim()) {
        const normalized = normalizeWebsite(form.website);
        try { new URL(normalized); } catch { errs.website = "Enter a valid website URL (e.g. malvix.io)."; }
      }
      if (!form.industry) errs.industry = "Please select your industry.";
      if (!form.employeeRange) errs.employeeRange = "Please select your employee range.";
      if (!form.country) errs.country = "Please select your country.";
    }
    if (s === 3) {
      if (!form.ownerName.trim()) errs.ownerName = "Your full name is required.";
      if (!form.email.trim()) {
        errs.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errs.email = "Enter a valid email address.";
      }
      if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    }
    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => (s < 3 ? (s + 1) as Step : s));
  };

  const prevStep = () => { setErrors({}); setStep(s => (s > 1 ? (s - 1) as Step : s)); };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep(3);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const websiteValue = form.website.trim() ? normalizeWebsite(form.website) : undefined;
      const res = await fetch(`${BASE_URL}/auth/register-org`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName:       form.orgName,
          companyEmail:  form.companyEmail,
          companyPhone:  form.companyPhone || undefined,
          website:       websiteValue,
          city:          form.city || undefined,
          country:       form.country,
          industry:      form.industry,
          employeeRange: form.employeeRange,
          ownerName:     form.ownerName,
          email:         form.email,
          password:      form.password,
          planId:        form.planId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      setDone(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-sm">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Registration Complete!</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Your account for <strong>{form.orgName}</strong> has been created.
                It is currently <span className="text-yellow-700 font-medium">pending activation</span>.
                Our team will review and activate your account shortly.
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-sm text-left">
              <div className="flex items-center gap-2.5 text-green-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Account created for <strong>{form.email}</strong></span>
              </div>
              {selectedPlan && (
                <div className="flex items-center gap-2.5 text-green-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Plan assigned: <strong>{selectedPlan.name}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-yellow-700">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Awaiting activation by support team</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Need help? Email us at{" "}
              <a href="mailto:support@hrmpro.com" className="text-primary hover:underline">
                support@hrmpro.com
              </a>
            </div>
            <a href={`${DASHBOARD_URL}/login`} className="block">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar */}
      <header className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base">HRM Pro</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href={`${DASHBOARD_URL}/login`} className="text-primary font-medium hover:underline">Sign in</a>
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center py-8 px-4">
        {/* Step progress */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-center justify-between relative">
            {/* connector line */}
            <div className="absolute top-5 left-0 right-0 h-px bg-border z-0">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
              />
            </div>
            {STEPS.map((s, i) => {
              const done = step > s.n;
              const active = step === s.n;
              return (
                <div key={s.n} className="flex flex-col items-center z-10" style={{ flex: i < STEPS.length - 1 ? 1 : "none" }}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                    done ? "bg-primary border-primary text-primary-foreground"
                    : active ? "bg-background border-primary text-primary"
                    : "bg-background border-border text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle className="w-5 h-5" /> : s.n}
                  </div>
                  <p className={`mt-1.5 text-xs font-medium ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit}>

            {/* ── STEP 1: Plan ──────────────────────────────────────────── */}
            {step === 1 && (
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Choose Your Plan</h2>
                  <p className="text-sm text-muted-foreground mt-1">Select the plan that fits your organization.</p>
                </div>

                {plansLoading ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">Loading plans…</div>
                ) : plans.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    No plans available yet. Please contact support.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plans.map(plan => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        selected={form.planId === plan.id}
                        onSelect={() => set("planId", plan.id)}
                      />
                    ))}
                    {errors.planId && (
                      <p className="text-xs text-destructive mt-1">{errors.planId}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Company Info ───────────────────────────────────── */}
            {step === 2 && (
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Company Information</h2>
                  <p className="text-sm text-muted-foreground mt-1">Tell us about your organization.</p>
                </div>

                <div className="space-y-4">
                  {/* Row 1: Company name */}
                  <Field label="Company / Organization Name" required error={errors.orgName}>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={form.orgName}
                        onChange={e => set("orgName", e.target.value)}
                        placeholder="Acme Trading LLC"
                        className={`pl-10 ${errors.orgName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                  </Field>

                  {/* Row 2: Company email + phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Company Email" required error={errors.companyEmail}>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={form.companyEmail}
                          onChange={e => set("companyEmail", e.target.value)}
                          placeholder="info@acme.com"
                          className={`pl-10 ${errors.companyEmail ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                      </div>
                    </Field>
                    <Field label="Company Phone" error={errors.companyPhone}>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={form.companyPhone}
                          onChange={e => set("companyPhone", e.target.value)}
                          placeholder="+92 300 1234567"
                          className="pl-10"
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Row 3: Website */}
                  <Field label="Website" error={errors.website}>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={form.website}
                        onChange={e => set("website", e.target.value)}
                        placeholder="malvix.io or https://acme.com"
                        className={`pl-10 ${errors.website ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                  </Field>

                  {/* Row 4: Industry + Employee range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Industry" required error={errors.industry}>
                      <Select value={form.industry} onValueChange={v => set("industry", v)}>
                        <SelectTrigger className={`w-full ${errors.industry ? "border-destructive" : ""}`}>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Select industry" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Number of Employees" required error={errors.employeeRange}>
                      <Select value={form.employeeRange} onValueChange={v => set("employeeRange", v)}>
                        <SelectTrigger className={`w-full ${errors.employeeRange ? "border-destructive" : ""}`}>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Select range" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_RANGES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Row 5: Country + City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Country" required error={errors.country}>
                      <Select value={form.country} onValueChange={v => set("country", v)}>
                        <SelectTrigger className={`w-full ${errors.country ? "border-destructive" : ""}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Select country" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="City">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={form.city}
                          onChange={e => set("city", e.target.value)}
                          placeholder="Lahore"
                          className="pl-10"
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Account ────────────────────────────────────────── */}
            {step === 3 && (
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Account Setup</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be the primary admin account for <strong>{form.orgName}</strong>.
                  </p>
                </div>

                {/* Summary strip */}
                {selectedPlan && (
                  <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Selected plan</p>
                      <p className="font-semibold text-sm mt-0.5">{selectedPlan.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">Rs {selectedPlan.priceMonthly.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <Field label="Your Full Name" required error={errors.ownerName}>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={form.ownerName}
                        onChange={e => set("ownerName", e.target.value)}
                        placeholder="John Doe"
                        className={`pl-10 ${errors.ownerName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                  </Field>

                  <Field label="Your Email (login email)" required error={errors.email}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={form.email}
                        onChange={e => set("email", e.target.value)}
                        placeholder="owner@acme.com"
                        className={`pl-10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Password" required error={errors.password}>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showPw ? "text" : "password"}
                          value={form.password}
                          onChange={e => set("password", e.target.value)}
                          placeholder="Min 6 characters"
                          className={`pl-10 pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPw(v => !v)}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                    <Field label="Confirm Password" required error={errors.confirmPassword}>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showPw ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={e => set("confirmPassword", e.target.value)}
                          placeholder="Repeat password"
                          className={`pl-10 ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                      </div>
                    </Field>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By creating an account you agree to our{" "}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                    Your account will be activated after payment confirmation.
                  </p>
                </div>
              </div>
            )}

            {/* ── Navigation footer ─────────────────────────────────────── */}
            <div className="border-t border-border px-6 sm:px-8 py-4 bg-muted/20 flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              ) : (
                <a href={`${DASHBOARD_URL}/login`}>
                  <Button type="button" variant="ghost" className="text-muted-foreground">
                    Sign in instead
                  </Button>
                </a>
              )}

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Step {step} of 3</span>
                {step < 3 ? (
                  <Button type="button" onClick={nextStep} disabled={step === 1 && plans.length === 0}>
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? "Submitting…" : <>Create Account <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          © 2026 HRM Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
