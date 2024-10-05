import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva("rounded-full animate-spin", {
  variants: {
    size: {
      default: "w-6 h-6",
      xs: "w-4 h-4",
      sm: "w-6 h-6",
      md: "w-8 h-8",
      lg: "w-10 h-10",
      xl: "w-12 h-12",
    },
    borderColor: {
      default: "border-gray-200 border-t-gray-600",
    },
    borderWidth: {
      default: "border-2 border-t-2",
      thin: "border-2 border-t-2",
      thick: "border-4 border-t-4",
    },
  },
  defaultVariants: {
    size: "default",
    borderColor: "default",
    borderWidth: "default",
  },
});

interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

/**
 * Displays an animated loading spinner.
 * Follows the same conventions as other ShadCN components.
 */
const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, borderColor, borderWidth, ...props }, ref) => {
    return (
      <div
        className={cn(
          spinnerVariants({ size, borderColor, borderWidth, className }),
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Spinner.displayName = "Spinner";

export { Spinner };
