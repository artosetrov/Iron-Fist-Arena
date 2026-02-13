"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type MobileSidebarContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

export const useMobileSidebar = (): MobileSidebarContextValue => {
  const ctx = useContext(MobileSidebarContext);
  if (!ctx) throw new Error("useMobileSidebar must be used within MobileSidebarProvider");
  return ctx;
};

type Props = { children: ReactNode };

const MobileSidebarProvider = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <MobileSidebarContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </MobileSidebarContext.Provider>
  );
};

export default MobileSidebarProvider;
