import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || "your email";
  const purpose = (location.state as any)?.purpose || "verify";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((v) => !v);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (purpose === "reset") {
        toast.success("Code verified! Set your new password.");
        navigate("/reset-password", { state: { email } });
      } else {
        toast.success("Email verified successfully!");
        navigate("/login");
      }
    }, 1000);
  };

  const handleResend = () => {
    setResendTimer(60);
    toast.success("Verification code resent!");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8 justify-center">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <h1 className="text-foreground font-bold text-base md:text-lg">TeamSync HRM</h1>
        </div>

        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
          <svg className="w-7 h-7 md:w-8 md:h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">Verify your email</h2>
        <p className="text-muted-foreground text-xs md:text-sm mb-6 md:mb-8">
          We've sent a 6-digit verification code to<br />
          <span className="font-medium text-foreground">{email}</span>
        </p>

        <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-10 h-12 md:w-12 md:h-14 text-center text-lg md:text-xl font-semibold rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
            />
          ))}
        </div>

        <Button onClick={handleVerify} className="w-full h-9 md:h-10 text-xs md:text-sm" disabled={loading}>
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        <p className="text-xs md:text-sm text-muted-foreground mt-4 md:mt-6">
          Didn't receive the code?{" "}
          {resendTimer > 0 ? (
            <span className="text-muted-foreground">Resend in {resendTimer}s</span>
          ) : (
            <button onClick={handleResend} className="text-primary font-medium hover:underline">Resend code</button>
          )}
        </p>

        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground mt-3 md:mt-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default VerifyOTP;
