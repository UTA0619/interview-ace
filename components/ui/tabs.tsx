"use client";

import * as React from "react";

type TabsContextValue = {
  value: string;
  onValueChange: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within Tabs");
  return ctx;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className = "",
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
  const value = controlledValue ?? uncontrolled;
  const handleChange = React.useCallback(
    (v: string) => {
      if (controlledValue === undefined) setUncontrolled(v);
      onValueChange?.(v);
    },
    [controlledValue, onValueChange]
  );
  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 p-1 text-zinc-500 " +
        className
      }
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: selected, onValueChange } = useTabs();
  const isSelected = selected === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? "active" : "inactive"}
      className={
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 " +
        (isSelected
          ? "bg-white text-zinc-900 shadow-sm"
          : "hover:text-zinc-900 hover:bg-zinc-50") +
        " " +
        className
      }
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: selected } = useTabs();
  if (selected !== value) return null;
  return (
    <div
      role="tabpanel"
      className={"mt-4 focus-visible:outline-none " + className}
    >
      {children}
    </div>
  );
}
