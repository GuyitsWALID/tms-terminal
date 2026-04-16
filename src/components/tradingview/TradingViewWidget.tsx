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

  const mergedConfig = useMemo(() => {
    return {
      locale: "en",
      isTransparent: true,
      colorTheme: widgetTheme,
      support_host: "https://www.tradingview.com",
      ...config,
    };
  }, [config, widgetTheme]);

  const configText = useMemo(() => JSON.stringify(mergedConfig), [mergedConfig]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let silentFailureTimer: ReturnType<typeof setTimeout> | undefined;

    const renderKey = `${scriptName}::${configText}`;
    if (renderKeyRef.current === renderKey && host.querySelector("iframe")) {
      return;
    }
    renderKeyRef.current = renderKey;

    host.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget h-full w-full";

    const script = document.createElement("script");
    script.src = `${SCRIPT_ROOT}/${scriptName}`;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = configText;

    script.onerror = () => {
      onError?.();
    };

    host.appendChild(widgetContainer);
    host.appendChild(script);

    // Some widgets fail silently with no script error; detect empty renders to trigger fallback.
    silentFailureTimer = setTimeout(() => {
      const hasIframe = Boolean(host.querySelector("iframe"));
      if (!hasIframe) {
        onError?.();
      }
    }, 3500);

    return () => {
      if (silentFailureTimer) clearTimeout(silentFailureTimer);
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
