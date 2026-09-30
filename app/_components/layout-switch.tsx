"use client";

import { useEffect } from "react";
import { desktopMinWidth, forcedLayout, layoutCookie, type Layout } from "@/lib/layout";

// Tells the proxy which layout fits this screen, and reloads the page when
// the window is resized across the breakpoint so the other layout is served.
export function LayoutSwitch() {
  useEffect(() => {
    if (forcedLayout) return;
    const query = window.matchMedia(`(min-width: ${desktopMinWidth}px)`);

    const savedLayout = () => document.cookie.match(new RegExp(`(?:^|; )${layoutCookie}=([^;]*)`))?.[1];

    function sync() {
      const layout: Layout = query.matches ? "desktop" : "mobile";
      if (savedLayout() === layout) return;
      document.cookie = `${layoutCookie}=${layout}; path=/; max-age=31536000; samesite=lax`;
      // Only reload once the cookie is saved, or blocked cookies would reload forever.
      if (savedLayout() === layout) window.location.reload();
    }

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return null;
}
