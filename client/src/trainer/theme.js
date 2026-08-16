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

// ─── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  bg:       "#0a0a0a",
  surface:  "#111111",
  card:     "#161616",
  card2:    "#1a1a1a",
  border:   "#222222",
  border2:  "#2a2a2a",
  lime:     "#C8F135",
  limeGlow: "rgba(200,241,53,0.12)",
  blue:     "#4FD8FF",
  blueGlow: "rgba(79,216,255,0.10)",
  purple:   "#8B5CF6",
  red:      "#FF4466",
  gold:     "#FFBB33",
  teal:     "#2dd4bf",
  text:     "#EAF6FF",
  sub:      "#7C93A8",
  muted:    "#3D5266",
  glow:     "0 0 18px rgba(200,241,53,0.45)",
  glowSoft: "0 0 30px rgba(200,241,53,0.18)",
};
