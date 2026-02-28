import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ";
    const variants = {
      default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-800",
      outline: "border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900",
      ghost: "hover:bg-zinc-100 hover:text-zinc-900",
    };
    return (
      <button
        className={base + variants[variant] + " " + className}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
