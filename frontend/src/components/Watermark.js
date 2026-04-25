/**
 * Drop-in watermark overlay. Place inside any element that has `position:
 * relative` (e.g. an aspect-ratio image container) — the overlay anchors to
 * the bottom-right and shows a translucent "Locofast" wordmark.
 *
 * Why a sibling overlay rather than wrapping the <img>?
 *   • Most existing card images already live inside a `relative` container
 *     with badges/buttons absolutely positioned on top. Adding a sibling
 *     keeps the layout exactly the same — no shifts, no z-index surprises.
 *   • Works regardless of image source (Cloudinary / `/api/uploads/` /
 *     external Unsplash) — the image bytes aren't touched.
 *
 * Set `REACT_APP_DISABLE_WATERMARK=true` to hide site-wide (e.g. premium
 * accounts, admin previews).
 */
import React from "react";

const DISABLED = process.env.REACT_APP_DISABLE_WATERMARK === "true";

const sizeClasses = {
  xs: "text-[9px] tracking-wide bottom-1 right-1",
  sm: "text-[10px] tracking-wide bottom-1.5 right-1.5",
  md: "text-xs tracking-wide bottom-2 right-2",
  lg: "text-sm tracking-wider bottom-3 right-3",
  xl: "text-base tracking-wider bottom-4 right-4",
};

const Watermark = ({ size = "md", className = "" }) => {
  if (DISABLED) return null;
  return (
    <span
      aria-hidden="true"
      data-testid="img-watermark"
      className={`pointer-events-none select-none absolute font-semibold text-white/75 ${sizeClasses[size] || sizeClasses.md} ${className}`}
      style={{
        textShadow: "0 0 2px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.35)",
        letterSpacing: "0.04em",
        zIndex: 1,
      }}
    >
      Locofast
    </span>
  );
};

export default Watermark;
