"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useLiquidRefraction, type RefractionOptions } from "./liquid-refraction";

/**
 * A `.lg` liquid-glass pane with real edge refraction where the browser
 * supports it. Use the plain `lg` class instead when the surface is already
 * inside a client component that can call useLiquidRefraction itself.
 */
export function LiquidGlass({
  className,
  refraction,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { refraction?: RefractionOptions }) {
  const ref = useRef<HTMLDivElement>(null);
  useLiquidRefraction(ref, refraction);
  return <div ref={ref} className={cn("lg", className)} {...rest} />;
}
