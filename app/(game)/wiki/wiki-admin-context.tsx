"use client";

import { createContext, useContext } from "react";

export type WikiAdminContextValue = { isAdmin: boolean; loading: boolean };

export const WikiAdminContext = createContext<WikiAdminContextValue>({
  isAdmin: false,
  loading: true,
});

export function useWikiAdmin(): WikiAdminContextValue {
  return useContext(WikiAdminContext);
}
