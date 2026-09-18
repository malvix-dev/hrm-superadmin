import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter a new password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-stat-free/15 flex items-center justify-center mx-auto mb-4 md:mb-6">
            <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-stat-free" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Password reset successful!</h2>
          <p className="text-muted-foreground text-xs md:text-sm mb-6 md:mb-8">Your password has been updated. You can now sign in with your new password.</p>
          <Button onClick={() => navigate("/login")} className="w-full h-9 md:h-10 text-xs md:text-sm">Back to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <h1 className="text-foreground font-bold text-base md:text-lg">Hostel Manager</h1>
        </div>

        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back to login
        </Link>

        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">Set new password</h2>
        <p className="text-muted-foreground text-xs md:text-sm mb-6 md:mb-8">Your new password must be at least 6 characters long.</p>

        <form onSubmit={handleReset} className="space-y-3 md:space-y-4">
          <div>
            <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="pl-8 md:pl-10 pr-9 md:pr-10 h-9 md:h-10 text-xs md:text-sm"
              />
              <button type="button" className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pl-8 md:pl-10 pr-9 md:pr-10 h-9 md:h-10 text-xs md:text-sm"
              />
              <button type="button" className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-9 md:h-10 text-xs md:text-sm" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
