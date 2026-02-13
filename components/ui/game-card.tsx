"use client";

import { type ReactNode } from "react";

interface GameCardProps {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "purple" | "gold" | "none";
}

export function GameCard({ children, className = "", glow = "none" }: GameCardProps) {
  const glowStyles = {
    cyan: "shadow-[var(--glow-cyan)]",
    purple: "shadow-[var(--glow-purple)]",
    gold: "shadow-[var(--glow-gold)]",
    none: "",
  };

  return (
    <div
      className={`rounded-2xl border border-card-border bg-card p-5 ${glowStyles[glow]} ${className}`}
    >
      {children}
    </div>
  );
}
