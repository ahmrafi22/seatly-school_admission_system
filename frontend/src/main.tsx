import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// BoardUI foundations, with the application layer imported inside globals.css
// so its `@theme` overrides are registered by Tailwind.
import "@/styles/globals.css";

// Self-hosted faces: no third-party font request, no layout shift when the
// network is slow, and the same files serve both languages.
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
 * Apply the stored theme before the first paint.
 *
 * The toggle component does this on mount, but that is one frame too late: the
 * page would flash white before flipping to dark. Reading localStorage here,
 * synchronously, costs nothing and removes the flash entirely.
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
