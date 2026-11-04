import type { ButtonHTMLAttributes } from "react";

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
}

/** A button styled as a text link, for row actions in tables. */
export function LinkButton({ danger = false, className, ...props }: LinkButtonProps) {
  const classes = ["link-button", danger && "link-button--danger", className].filter(Boolean).join(" ");
  return <button type="button" className={classes} {...props} />;
}
