"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TradingViewWidgetProps = {
  scriptName: string;
  config: Record<string, unknown>;
  className?: string;
  containerClassName?: string;
  onError?: () => void;
};

const SCRIPT_ROOT = "https://s3.tradingview.com/external-embedding";

export default function TradingViewWidget({
  scriptName,
  config,
  className,
  containerClassName,
  onError,
}: TradingViewWidgetProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const renderKeyRef = useRef<string>("");
  const errorFiredRef = useRef(false);
  const [widgetTheme, setWidgetTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setWidgetTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const mergedConfig = useMemo(() => ({
    locale: "en",
    isTransparent: true,
    colorTheme: widgetTheme,
    support_host: "https://www.tradingview.com",
    ...config,
  }), [config, widgetTheme]);

  const configText = useMemo(() => JSON.stringify(mergedConfig), [mergedConfig]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderKey = `${scriptName}::${configText}`;
    if (renderKeyRef.current === renderKey && host.querySelector("iframe")) return;
    renderKeyRef.current = renderKey;
    errorFiredRef.current = false;

    host.innerHTML = "";

    const fireError = () => {
      if (!errorFiredRef.current) {
        errorFiredRef.current = true;
        onError?.();
      }
    };

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget h-full w-full";

    const script = document.createElement("script");
    script.src = `${SCRIPT_ROOT}/${scriptName}`;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = configText;
    script.onerror = () => fireError();

    host.appendChild(widgetContainer);
    host.appendChild(script);

    // Check 1 at 2s — no iframe at all → immediate fallback
    const t1 = setTimeout(() => {
      const iframe = host.querySelector("iframe") as HTMLIFrameElement | null;
      if (!iframe) { fireError(); return; }

      // Check 2 at 4s — iframe exists but appears blank/zero-height
      const t2 = setTimeout(() => {
        const iframeEl = host.querySelector("iframe") as HTMLIFrameElement | null;
        if (!iframeEl) { fireError(); return; }

        // If iframe has no visible height, treat as failed
        if (iframeEl.clientHeight < 20) { fireError(); return; }

        // Try same-origin body check
        try {
          const doc = iframeEl.contentDocument;
          if (doc && doc.body && doc.body.innerHTML.trim() === "") fireError();
        } catch { /* cross-origin — assume loaded */ }
      }, 2000);

      return () => clearTimeout(t2);
    }, 2000);

    return () => {
      clearTimeout(t1);
      host.innerHTML = "";
    };
  }, [scriptName, configText, onError]);

  return (
    <div className={cn("tradingview-widget-container h-full w-full", className)}>
      <div
        ref={hostRef}
        className={cn("tradingview-widget-container h-full w-full min-h-[320px] overflow-hidden", containerClassName)}
      />
    </div>
  );
}
