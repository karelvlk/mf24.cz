import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

const envScreenshotDefault =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env?.VITE_SCREENSHOT_MODE === "string" &&
  import.meta.env.VITE_SCREENSHOT_MODE.toLowerCase() === "true";

const ScreenshotModeContext = createContext<boolean>(envScreenshotDefault);

const FALSE_LIKE_VALUES = new Set(["0", "false", "no", "off"]);

function isTruthyParam(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return null;
  }

  if (FALSE_LIKE_VALUES.has(normalized)) {
    return false;
  }

  return true;
}

export function ScreenshotModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const enabled = useMemo(() => {
    if (typeof window === "undefined") {
      return envScreenshotDefault;
    }

    const params = new URLSearchParams(location.search);
    const paramValue = params.get("screenshot");
    const parsed = isTruthyParam(paramValue);

    if (parsed === null) {
      return envScreenshotDefault;
    }

    return parsed;
  }, [location.search]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.toggle("screenshot-mode", enabled);
    document.body.setAttribute(
      "data-screenshot-mode",
      enabled ? "true" : "false"
    );

    return () => {
      document.body.classList.remove("screenshot-mode");
      document.body.removeAttribute("data-screenshot-mode");
    };
  }, [enabled]);

  return (
    <ScreenshotModeContext.Provider value={enabled}>
      {children}
    </ScreenshotModeContext.Provider>
  );
}

export function useScreenshotMode() {
  return useContext(ScreenshotModeContext);
}
