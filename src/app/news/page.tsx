"use client";

import { useMemo, useState } from "react";
import NewsFeed from "@/components/news/NewsFeed";
import TradingViewPanel from "@/components/tradingview/TradingViewPanel";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";

export default function NewsPage() {
  const [widgetFailed, setWidgetFailed] = useState(false);
  const newsConfig = useMemo(
    () => ({
      displayMode: "regular",
      feedMode: "all_symbols",
      width: "100%",
      height: 620,
    }),
    []
  );

  return (
    <div className="space-y-3">
      <TradingViewPanel title="Top Stories / Live" bodyClassName="p-0">
        <div className="h-[70vh] min-h-[420px] sm:min-h-[560px]">
          {!widgetFailed ? (
            <TradingViewWidget
              scriptName="embed-widget-timeline.js"
              config={newsConfig}
              onError={() => setWidgetFailed(true)}
            />
          ) : (
            <div className="h-full p-2 sm:p-3">
              <NewsFeed />
            </div>
          )}
        </div>
      </TradingViewPanel>
    </div>
  );
}
