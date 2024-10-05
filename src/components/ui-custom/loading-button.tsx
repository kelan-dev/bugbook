import React from "react";
import { Button, ButtonProps } from "../ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
}

/**
 * Modeled after the ShadCN Button component.
 * Displays a loading spinner when the button is in a loading state.
 */
function LoadingButton({
  loading,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {loading && <Spinner size="xs" />}
      {props.children}
    </Button>
  );
}

export { LoadingButton };
