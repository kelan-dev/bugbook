import React, { useState } from "react";
import { Input, InputProps } from "../ui/input";
import { cn } from "@/lib/utils";
import { EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons";

/**
 * Modeled after the ShadCN Input component.
 * Adds a button to toggle password visibility.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      // We need a relative container so that the button can be positioned absolutely
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pe-8", className)}
          ref={ref}
          {...props}
        />
        {/* Use type="button" so that the button doesn't submit forms */}
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          title={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground"
        >
          {showPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
