/**
 * Injects Cloudinary delivery optimizations (f_auto, q_auto, width) into
 * image URLs. Non-Cloudinary URLs are returned unchanged.
 *
 * Input : https://res.cloudinary.com/<cloud>/image/upload/v123/fabrics/abc.jpg
 * Output: https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,w_400/v123/fabrics/abc.jpg
 *
 * Saves ~50-70% bandwidth vs. originals and lets Cloudinary auto-negotiate
 * AVIF/WebP based on the client's Accept header.
 */
export const optimizeCloudinaryImage = (url, width) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  // Avoid double-injecting the transform
  if (/\/image\/upload\/[^/]*(f_auto|q_auto|w_\d+)/.test(url)) return url;

  const w = Number.isFinite(+width) && +width > 0 ? `,w_${+width}` : "";
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto${w}/`);
};

/** Thumbnail for grid cards / lists (~400px) */
export const thumbImage = (url) => optimizeCloudinaryImage(url, 400);

/** Medium image for detail previews (~800px) */
export const mediumImage = (url) => optimizeCloudinaryImage(url, 800);

/** Large / hero image (~1600px) */
export const largeImage = (url) => optimizeCloudinaryImage(url, 1600);

/**
 * Returns the best available "cover" image URL for a fabric, falling back
 * through: root images → first color_variant image → undefined.
 *
 * Multi-color SKUs (e.g. denim sold in Indigo ×White) often store imagery on
 * `color_variants[i].image_url` with an empty root `images` array; this helper
 * makes card thumbnails resilient to either storage pattern.
 */
export const fabricCoverImage = (fabric) => {
  if (!fabric) return undefined;
  const rootImg = Array.isArray(fabric.images) ? fabric.images[0] : undefined;
  if (rootImg) return rootImg;
  const variants = Array.isArray(fabric.color_variants) ? fabric.color_variants : [];
  for (const v of variants) {
    if (v && v.image_url) return v.image_url;
    if (v && Array.isArray(v.images) && v.images[0]) return v.images[0];
  }
  return undefined;
};
