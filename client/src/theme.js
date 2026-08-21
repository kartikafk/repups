// ─── NEON-BLUE DARK THEME ────────────────────────────────────────────────────
// Shared design tokens for the RepUps application
// Use these constants instead of hard-coding color values

export const theme = {
  // Backgrounds
  bg: "#060B14",           // Page background (near-black navy)
  surface: "#101826",      // Card background
  surfaceAlt: "#0B1220",   // Nested/icon backgrounds
  
  // Borders
  border: "#1C2636",       // Card borders
  borderLight: "#243444",  // Lighter borders for hover states
  
  // Accent colors (neon-blue theme)
  neon: "#29E0FF",         // Primary accent (buttons, active states, highlights)
  neonDeep: "#3D5AFE",     // Secondary accent (links, secondary glow)
  
  // Text
  textPrimary: "#F5F9FF",  // Primary text color
  textMuted: "#8592A6",    // Muted/secondary text
  textDim: "#5F6D7E",      // Very dim text
  
  // Status colors
  success: "#4DFFA0",      // Success/positive
  warning: "#FFB020",      // Warning
  error: "#FF4D6D",        // Error/danger
  
  // Glow effects (for box-shadow)
  glowNeon: "0 18px 40px -22px rgba(41, 224, 255, 0.5)",
  glowNeonSoft: "0 8px 24px -8px rgba(41, 224, 255, 0.3)",
  glowNeonDeep: "0 18px 40px -22px rgba(61, 90, 254, 0.4)",
  glowCard: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 20px rgba(0,0,0,0.5)",
  
  // Common shadows
  shadowSm: "0 2px 8px rgba(0,0,0,0.4)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.5)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.6)",
  
  // Border radius
  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "16px",
  radiusXl: "20px",
  radiusFull: "999px",
  
  // Typography
  fontMono: "'Space Mono', monospace",
  fontSans: "'DM Sans', 'Inter', sans-serif",
  fontTitle: "'Syne', sans-serif",
};

// Helper function to create rgba values
export function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Responsive breakpoint helper (can be used in components)
export function useBreakpoint() {
  if (typeof window === 'undefined') return { width: 1280, isMobile: false, isTablet: false, isDesktop: true };
  
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  
  return { 
    width, 
    isMobile: width < 720, 
    isTablet: width >= 720 && width < 1080, 
    isDesktop: width >= 1080 
  };
}

// Import React hooks if needed for useBreakpoint
import { useState, useEffect } from "react";
