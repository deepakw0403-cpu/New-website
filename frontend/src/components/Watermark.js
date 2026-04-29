/**
 * Brand watermark overlay using the official Locofast mark (woven X
 * monogram + wordmark). Four variants — pick one project-wide via
 * REACT_APP_WATERMARK_VARIANT or per-instance via the `variant` prop.
 *
 *   "label"      — original text-only bottom-right wordmark
 *   "hover-chip" — Option A: invisible until card hover; fades to a
 *                  glassmorphic pill with the brand mark + wordmark
 *   "tiled"      — Option B: faint repeating brand mark across image
 *   "bottom-bar" — Option C: thin gradient strip + mark + wordmark
 *
 * Set REACT_APP_DISABLE_WATERMARK=true to hide site-wide.
 */
import React from "react";

const DISABLED = process.env.REACT_APP_DISABLE_WATERMARK === "true";
const DEFAULT_VARIANT = process.env.REACT_APP_WATERMARK_VARIANT || "label";

// ── Official Locofast monogram (the woven "X" / star) ─────────────────────
// Extracted from the brand SVG. Wrapped here so we can colourise it (white
// for on-image overlays, brand blue for hover chips on light surfaces).
const BRAND_BLUE = "#0067E2";

const LocofastMark = ({ size = 14, color = "white", className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="100 0 200 200"
    aria-hidden="true"
    className={className}
    style={{ flexShrink: 0 }}
  >
    <g fill={color}>
      <path d="M113.47 40.0946C107.343 46.2214 107.343 56.155 113.47 62.2818L173.375 122.187L195.563 100L135.657 40.0946C129.53 33.9678 119.597 33.9678 113.47 40.0946Z" />
      <path d="M104.595 84.469C98.4683 90.5958 98.4683 100.529 104.595 106.656L146.751 148.812L168.938 126.625L126.782 84.469C120.655 78.3422 110.722 78.3422 104.595 84.469Z" />
      <path d="M259.905 13.47C253.779 7.34316 243.845 7.34317 237.718 13.47L177.813 73.3754L200 95.5626L259.905 35.6572C266.032 29.5303 266.032 19.5968 259.905 13.47Z" />
      <path d="M215.531 4.59511C209.404 -1.53172 199.471 -1.5317 193.344 4.59513L151.188 46.7508L173.375 68.9379L215.531 26.7823C221.658 20.6555 221.658 10.7219 215.531 4.59511Z" />
      <path d="M286.53 159.905C292.657 153.779 292.657 143.845 286.53 137.718L226.625 77.8128L204.437 100L264.343 159.905C270.47 166.032 280.403 166.032 286.53 159.905Z" />
      <path d="M295.405 115.531C301.532 109.404 301.532 99.4707 295.405 93.3438L253.249 51.1882L231.062 73.3754L273.218 115.531C279.345 121.658 289.278 121.658 295.405 115.531Z" />
      <path d="M140.095 186.53C146.221 192.657 156.155 192.657 162.282 186.53L222.187 126.625L200 104.437L140.095 164.343C133.968 170.47 133.968 180.403 140.095 186.53Z" />
      <path d="M184.469 195.405C190.596 201.532 200.529 201.532 206.656 195.405L248.812 153.249L226.625 131.062L184.469 173.218C178.342 179.345 178.342 189.278 184.469 195.405Z" />
    </g>
  </svg>
);

// Tiled SVG pattern: brand mark + small wordmark, rotated -22°. Repeated
// at low opacity to make scraping unviable while staying subtle.
const TILED_SVG = encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'>
  <g transform='rotate(-22 120 90) translate(20 60)' fill='rgba(255,255,255,0.55)'>
    <g transform='scale(0.18)'>
      <path d='M113.47 40.09C107.34 46.22 107.34 56.16 113.47 62.28L173.38 122.19L195.56 100L135.66 40.09C129.53 33.97 119.6 33.97 113.47 40.09Z'/>
      <path d='M104.6 84.47C98.47 90.6 98.47 100.53 104.6 106.66L146.75 148.81L168.94 126.63L126.78 84.47C120.66 78.34 110.72 78.34 104.6 84.47Z'/>
      <path d='M259.91 13.47C253.78 7.34 243.85 7.34 237.72 13.47L177.81 73.38L200 95.56L259.91 35.66C266.03 29.53 266.03 19.6 259.91 13.47Z'/>
      <path d='M215.53 4.6C209.4 -1.53 199.47 -1.53 193.34 4.6L151.19 46.75L173.38 68.94L215.53 26.78C221.66 20.66 221.66 10.72 215.53 4.6Z'/>
      <path d='M286.53 159.91C292.66 153.78 292.66 143.85 286.53 137.72L226.63 77.81L204.44 100L264.34 159.91C270.47 166.03 280.4 166.03 286.53 159.91Z'/>
      <path d='M295.41 115.53C301.53 109.4 301.53 99.47 295.41 93.34L253.25 51.19L231.06 73.38L273.22 115.53C279.35 121.66 289.28 121.66 295.41 115.53Z'/>
      <path d='M140.1 186.53C146.22 192.66 156.16 192.66 162.28 186.53L222.19 126.63L200 104.44L140.1 164.34C133.97 170.47 133.97 180.4 140.1 186.53Z'/>
      <path d='M184.47 195.41C190.6 201.53 200.53 201.53 206.66 195.41L248.81 153.25L226.63 131.06L184.47 173.22C178.34 179.35 178.34 189.28 184.47 195.41Z'/>
    </g>
    <text x='110' y='28' font-family='Inter, system-ui, sans-serif' font-weight='700' font-size='17' letter-spacing='0.5'>Locofast</text>
  </g>
</svg>
`).replace(/\n\s*/g, "");
const TILED_BG = `url("data:image/svg+xml;utf8,${TILED_SVG}")`;

// Sizes for the simple "label" fallback.
const labelSizes = {
  xs: "text-[9px] tracking-wide bottom-1 right-1",
  sm: "text-[10px] tracking-wide bottom-1.5 right-1.5",
  md: "text-xs tracking-wide bottom-2 right-2",
  lg: "text-sm tracking-wider bottom-3 right-3",
  xl: "text-base tracking-wider bottom-4 right-4",
};

const Watermark = ({ size = "md", variant = DEFAULT_VARIANT, className = "" }) => {
  if (DISABLED) return null;

  // ── Option A — Hover-revealed glassmorphic chip (mark + wordmark) ─────
  if (variant === "hover-chip") {
    return (
      <span
        aria-hidden="true"
        data-testid="img-watermark"
        className={`pointer-events-none select-none absolute bottom-2 right-2
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    backdrop-blur-md bg-white/15 border border-white/30
                    text-white text-[11px] font-semibold tracking-wide ${className}`}
        style={{ zIndex: 1, boxShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
      >
        <LocofastMark size={11} color="white" />
        Locofast
      </span>
    );
  }

  // ── Option B — Tiled diagonal pattern (mark + wordmark) ────────────────
  if (variant === "tiled") {
    return (
      <span
        aria-hidden="true"
        data-testid="img-watermark"
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{
          backgroundImage: TILED_BG,
          backgroundRepeat: "repeat",
          backgroundSize: "240px 180px",
          mixBlendMode: "overlay",
          opacity: 0.55,
          zIndex: 1,
        }}
      />
    );
  }

  // ── Option C — Bottom film-credit bar with mark + wordmark ─────────────
  if (variant === "bottom-bar") {
    return (
      <span
        aria-hidden="true"
        data-testid="img-watermark"
        className={`pointer-events-none absolute left-0 right-0 bottom-0
                    flex items-center justify-end gap-1.5 px-3 py-1.5 ${className}`}
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
          zIndex: 1,
        }}
      >
        <LocofastMark size={11} color="white" />
        <span
          className="text-white text-[10px] font-semibold tracking-[0.16em] uppercase"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
        >
          Locofast
        </span>
      </span>
    );
  }

  // ── Default: original always-on text label (with brand mark prefix) ───
  return (
    <span
      aria-hidden="true"
      data-testid="img-watermark"
      className={`pointer-events-none select-none absolute inline-flex items-center gap-1
                  font-semibold text-white/85 ${labelSizes[size] || labelSizes.md} ${className}`}
      style={{
        textShadow: "0 0 2px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.35)",
        letterSpacing: "0.04em",
        zIndex: 1,
      }}
    >
      <LocofastMark size={10} color="white" />
      Locofast
    </span>
  );
};

export default Watermark;
export { LocofastMark, BRAND_BLUE };
