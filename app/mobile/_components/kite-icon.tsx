"use client";

import { useId } from "react";

// The kite from the Teech logo, redrawn as a vector so it stays crisp at icon sizes.
// It paints in `currentColor`; the two cross spars are cut out (not painted white),
// so whatever is behind the icon shows through them.
const kite = "M46.3 3 L96.5 29.6 Q73 60 56.2 97 L3.2 53.9 Z";
const verticalSpar = "M46.5 3 C33 35 36 70 56 97 C49 68 51 34 46.5 3 Z";
const horizontalSpar = "M3 54 C35 35 65 31 97 29.5 C65 43 35 49 3 54 Z";

export function KiteIcon({ size = 20, className }: { size?: number; className?: string }) {
  const maskId = `kite-spars-${useId().replace(/:/g, "")}`;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <path d={verticalSpar} fill="#000" />
          <path d={horizontalSpar} fill="#000" />
        </mask>
      </defs>
      <path
        d={kite}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinejoin="round"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
