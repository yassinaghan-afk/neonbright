"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-full overflow-hidden group";

  const variants = {
    primary:
      "bg-neon-pink text-white glow-cta hover:scale-[1.03] active:scale-[0.98]",
    secondary:
      "glass-premium text-white hover:border-neon-purple/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:scale-[1.02] active:scale-[0.98]",
    ghost: "bg-transparent text-muted hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-5 py-2.5 text-sm",
    md: "px-7 py-3.5 text-sm",
    lg: "px-9 py-4 text-base tracking-wide",
  };

  const classes = cn(
    base,
    variants[variant],
    sizes[size],
    disabled && "pointer-events-none opacity-50",
    className
  );

  const content = (
    <>
      {variant === "primary" && (
        <>
          <span className="absolute inset-0 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
        </>
      )}
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </>
  );

  if (href) {
    return (
      <motion.a href={href} className={classes} whileTap={{ scale: 0.97 }}>
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
    >
      {content}
    </motion.button>
  );
}
