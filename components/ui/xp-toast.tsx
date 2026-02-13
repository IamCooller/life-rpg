"use client";

import { useEffect, useState } from "react";

interface XPToastProps {
  xp: number;
  onDone?: () => void;
}

export function XPToast({ xp, onDone }: XPToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-float-up rounded-xl border border-accent-gold/30 bg-accent-gold/20 px-4 py-2 text-lg font-bold text-accent-gold shadow-lg">
      +{xp} XP
    </div>
  );
}
