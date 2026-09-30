export type Layout = "mobile" | "desktop";

export const layoutCookie = "teech-layout";

// Screens at least this wide get the desktop layout.
export const desktopMinWidth = 1024;

// Serve this layout on every screen size, ignoring the width check.
// Set it back to null to switch between mobile and desktop by width again.
export const forcedLayout: Layout | null = "desktop";
