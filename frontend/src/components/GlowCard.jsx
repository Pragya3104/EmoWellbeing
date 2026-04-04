import React from "react";
import clsx from "clsx";

export default function GlowCard({
  children,
  glow = "from-indigo-500 via-violet-500 to-fuchsia-500",
  className = "",
}) {
  return (
    <div className={clsx("relative group", className)}>
      
      {/* 🔥 GLOW LAYER */}
      <div
        className={clsx(
          "pointer-events-none absolute -inset-[1px] rounded-[inherit] blur-xl opacity-0 transition-all duration-300 group-hover:opacity-100",
          "bg-gradient-to-r",
          glow
        )}
      />

      {/* CONTENT */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}