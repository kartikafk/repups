import { useState, useEffect } from "react";

// ─── Responsive helper ────────────────────────────────────────────────────────
export function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return { width, isMobile: width < 720, isTablet: width >= 720 && width < 1080, isDesktop: width >= 1080 };
}

// ─── Design tokens (aligned with global CSS variables) ────────────────────────
export const C = {
  bg:       "#080A0E",
  surface:  "#0F1117",
  card:     "#161B24",
  card2:    "#1A2030",
  border:   "#232B3A",
  border2:  "#2D3748",
  lime:     "#C8FF4D",
  limeGlow: "rgba(200,255,77,0.12)",
  blue:     "#4D9FFF",
  blueGlow: "rgba(77,159,255,0.10)",
  purple:   "#8B5CF6",
  red:      "#FF4D6D",
  gold:     "#FFB020",
  teal:     "#2dd4bf",
  good:     "#4DFFA0",
  text:     "#EDF2FF",
  sub:      "#7A8BA8",
  muted:    "#3D4F66",
  glow:     "0 0 20px rgba(200,255,77,0.45)",
  glowSoft: "0 0 30px rgba(200,255,77,0.18)",
};