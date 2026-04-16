"use client";

import { useMemo, useState } from "react";
import EconomicCalendar from "@/components/calendar/EconomicCalendar";
import TradingViewPanel from "@/components/tradingview/TradingViewPanel";
import TradingViewWidget from "@/components/tradingview/TradingViewWidget";

export default function CalendarPage() {
  const [widgetFailed, setWidgetFailed] = useState(false);
  const eventsConfig = useMemo(
    () => ({
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
      importanceFilter: "-1,0,1",
      width: "100%",
      height: 620,
    }),
    []
  );

  return (
    <div className="space-y-3">
      <TradingViewPanel title="Economic Calendar / Live" bodyClassName="p-0">
        <div className="h-[70vh] min-h-[420px] sm:min-h-[560px]">
          {!widgetFailed ? (
            <TradingViewWidget
              scriptName="embed-widget-events.js"
              config={eventsConfig}
              onError={() => setWidgetFailed(true)}
            />
          ) : (
            <div className="h-full p-2 sm:p-3">
              <EconomicCalendar />
            </div>
          )}
        </div>
      </TradingViewPanel>
    </div>
  );
}
