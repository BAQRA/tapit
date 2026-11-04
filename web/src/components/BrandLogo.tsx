/** Logo files live in web/public/brand (optimized copies of the TapIT logo kit). */
const LOGOS = {
  /** "TapIT" text only. */
  wordmark: {
    light: "/brand/tapit-wordmark.svg",
    dark: "/brand/tapit-wordmark-white.svg",
    aspectRatio: 2.519,
  },
  /** Card mark + "TapIT". */
  full: { light: "/brand/tapit-logo.svg", dark: "/brand/tapit-logo-white.svg", aspectRatio: 2.346 },
} as const;

interface BrandLogoProps {
  variant?: keyof typeof LOGOS;
  /** Height in px; width follows the logo's proportions. */
  height?: number;
  className?: string;
}

/**
 * The TapIT logo. Swaps to the white version in dark mode, so the ink-colored
 * "Tap" stays readable on dark backgrounds (the blue "IT" is the same in both).
 */
export function BrandLogo({ variant = "wordmark", height = 24, className }: BrandLogoProps) {
  const logo = LOGOS[variant];
  return (
    <picture className={className}>
      <source srcSet={logo.dark} media="(prefers-color-scheme: dark)" />
      <img
        src={logo.light}
        alt="TapIT"
        height={height}
        width={Math.round(height * logo.aspectRatio)}
        style={{ display: "block" }}
      />
    </picture>
  );
}
