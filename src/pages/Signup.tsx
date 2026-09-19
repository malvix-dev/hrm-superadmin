import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, Eye, EyeOff, Mail, Lock, User, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxBranches: number;
  maxEmployees: number;
  features: string[];
}

export default function Signup() {
  const [form, setForm] = useState({ orgName: "", ownerName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["public-plans"],
    queryFn: () => apiGet<Plan[]>("/public/plans"),
  });
  const plan = plans[0] ?? null;

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/register-org`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName: form.orgName, ownerName: form.ownerName, email: form.email, password: form.password }),
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

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Registration Successful!</h2>
            <p className="text-muted-foreground mt-2">
              Your account has been created and is <span className="font-medium text-yellow-700">pending activation</span>.
              We'll review your account and activate it shortly. You'll be able to log in once activated.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" /> Account registered
            </div>
            <div className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-4 h-4" /> Awaiting activation by support
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at <span className="text-primary">support@hrmpro.com</span>
          </p>
          <Link to="/login" className="block text-primary text-sm font-medium hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — plan info */}
      <div className="hidden lg:flex lg:w-2/5 bg-primary flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-primary-foreground font-bold text-lg">HRM Pro</h1>
        </div>

        {plan ? (
          <div className="space-y-6">
            <div>
              <p className="text-primary-foreground/70 text-sm uppercase tracking-wider mb-1">You're signing up for</p>
              <h2 className="text-primary-foreground text-3xl font-bold">{plan.name}</h2>
              <p className="text-primary-foreground/80 text-xl mt-1">
                Rs {plan.priceMonthly.toLocaleString()}<span className="text-sm font-normal">/month</span>
              </p>
            </div>
            <div className="space-y-2">
              {[
                `Up to ${plan.maxBranches} branches`,
                `Up to ${plan.maxEmployees} employees`,
                ...plan.features,
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-primary-foreground/90 text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0" /> {f}
                </div>
              ))}
            </div>
            <p className="text-primary-foreground/60 text-xs">
              Your account will be activated after payment confirmation.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-primary-foreground text-3xl font-bold">Start managing your team today</h2>
          </div>
        )}

        <p className="text-primary-foreground/40 text-xs">© 2026 HRM Pro. All rights reserved.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-base">HRM Pro</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1">Create your account</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Fill in the details below. Your account will be activated after payment confirmation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Organization Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.orgName} onChange={e => update("orgName", e.target.value)} placeholder="Acme Trading Co." className="pl-10" required />
              </div>
            </div>

            <div>
              <Label className="text-sm mb-1.5 block">Your Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={form.ownerName} onChange={e => update("ownerName", e.target.value)} placeholder="John Doe" className="pl-10" required />
              </div>
            </div>

            <div>
              <Label className="text-sm mb-1.5 block">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" className="pl-10" required />
              </div>
            </div>

            <div>
              <Label className="text-sm mb-1.5 block">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  placeholder="Min 6 characters"
                  className="pl-10 pr-10"
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-1.5 block">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={e => update("confirmPassword", e.target.value)}
                  placeholder="Repeat password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering…" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
