import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// BoardUI foundations; the application layer is imported inside globals.css so
// its `@theme` overrides are registered by Tailwind.
import "@/styles/globals.css";

// Self-hosted faces: no third-party font request and no layout shift.
import "@fontsource-variable/inter";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource-variable/noto-sans-bengali";
import "@fontsource-variable/jetbrains-mono";

import App from "@/src/App";
import { LanguageProvider } from "@/src/i18n/LanguageProvider";

/**
 * Apply the stored theme before the first paint. The toggle does this on mount,
 * which is a frame too late and flashes white.
 */
try {
  const stored = window.localStorage.getItem("boardui:theme");
  if (stored === "dark") {
    document.documentElement.classList.add("dark");
  }
} catch {
  // Storage blocked: light mode is a fine default.
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
