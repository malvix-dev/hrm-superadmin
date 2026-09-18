import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  span?: number;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, hint, error, span, className, ...props }, ref) => (
    <div className={span === 3 ? "md:col-span-2 lg:col-span-3" : span === 2 ? "md:col-span-2" : ""}>
      {label && <Label className="text-sm text-muted-foreground mb-1.5 block">{label}</Label>}
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          error && "border-destructive",
          className,
        )}
        {...props}
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
);
FormInput.displayName = "FormInput";

export { FormInput };
