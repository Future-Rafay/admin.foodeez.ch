"use client"

import { createContext, useContext, useState, ReactNode } from "react";

interface BusinessContextType {
  businessId: string | null;
  setBusinessId: (id: string | null) => void;
}

const BusinessContext = createContext<BusinessContextType>({
  businessId: null,
  setBusinessId: () => {},
});

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  return (
    <BusinessContext.Provider value={{ businessId, setBusinessId }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessId() {
  return useContext(BusinessContext).businessId;
}
export function useSetBusinessId() {
  return useContext(BusinessContext).setBusinessId;
} 