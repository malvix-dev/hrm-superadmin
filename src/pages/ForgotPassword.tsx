import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Verification code sent to your email");
      navigate("/verify-otp", { state: { email, purpose: "reset" } });
    }, 1000);
  };

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

        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">Forgot password?</h2>
        <p className="text-muted-foreground text-xs md:text-sm mb-6 md:mb-8">
          No worries! Enter your email and we'll send you a verification code to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <Label className="text-xs md:text-sm text-muted-foreground mb-1.5 block">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-8 md:pl-10 h-9 md:h-10 text-xs md:text-sm"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-9 md:h-10 text-xs md:text-sm" disabled={loading}>
            {loading ? "Sending..." : <>Send Verification Code <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1 md:ml-1.5" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
