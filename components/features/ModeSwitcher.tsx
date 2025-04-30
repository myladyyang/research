"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

export type Mode = "search" | "research";

interface ModeSwitcherProps {
  currentMode: Mode;
  onChange: (mode: Mode) => void;
  className?: string;
}

export function ModeSwitcher({
  currentMode,
  onChange,
  className = "",
}: ModeSwitcherProps) {
  return (
    <div className={`inline-flex rounded-md border border-border overflow-hidden ${className}`}>
      <Button
        variant={currentMode === "search" ? "primary" : "ghost"}
        onClick={() => onChange("search")}
        className={`rounded-none border-0 ${
          currentMode === "search" ? "" : "text-muted-foreground"
        }`}
      >
        搜索
      </Button>
      <div className="w-px bg-border"></div>
      <Button
        variant={currentMode === "research" ? "primary" : "ghost"}
        onClick={() => onChange("research")}
        className={`rounded-none border-0 ${
          currentMode === "research" ? "" : "text-muted-foreground"
        }`}
      >
        研究
      </Button>
    </div>
  );
} 