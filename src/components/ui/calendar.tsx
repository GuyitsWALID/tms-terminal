"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col",
        month: "space-y-2",
        month_caption: "relative flex h-7 items-center justify-center",
        caption_label: "text-sm font-semibold text-[var(--ink-primary)]",
        nav: "absolute inset-x-0 top-0 z-10 flex h-7 items-center justify-between px-1",
        button_previous:
          "inline-flex h-5 w-5 items-center justify-center rounded-sm bg-transparent p-0 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        button_next:
          "inline-flex h-5 w-5 items-center justify-center rounded-sm bg-transparent p-0 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "h-7 w-7 text-center text-[11px] font-medium text-[var(--ink-muted)]",
        week: "mt-1 flex w-full",
        day: "h-7 w-7 p-0",
        day_button: "h-7 w-7 rounded-md p-0 text-sm font-medium text-[var(--ink-primary)] hover:bg-[var(--surface-hover)] aria-selected:bg-[#3a3c40] aria-selected:text-white",
        selected: "bg-[#3a3c40] text-white",
        today: "bg-[var(--surface-hover)] text-[var(--ink-primary)]",
        outside: "text-[var(--ink-muted)] opacity-45",
        disabled: "text-[var(--ink-muted)] opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-3.5 w-3.5", iconClassName)} />
          ) : (
            <ChevronRight className={cn("h-3.5 w-3.5", iconClassName)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
