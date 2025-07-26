"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface BusinessContextType {
  businessId: string | null;
  setBusinessId: (id: string) => void;
  clearBusinessId: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessId, setBusinessIdState] = useState<string | null>(null);

  const setBusinessId = useCallback((id: string) => {
    if (!id) {
      console.error("Invalid business ID provided to setBusinessId");
      return;
    }
    console.log("Setting business ID:", id);
    setBusinessIdState(id);
  }, []);

  const clearBusinessId = useCallback(() => {
    console.log("Clearing business ID");
    setBusinessIdState(null);
  }, []);

  return (
    <BusinessContext.Provider value={{ businessId, setBusinessId, clearBusinessId }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusinessContext must be used within a BusinessProvider");
  }
  return context;
}

export function useBusinessId() {
  const { businessId } = useBusinessContext();
  return businessId;
}

export function useSetBusinessId() {
  const { setBusinessId } = useBusinessContext();
  return setBusinessId;
}

export function useClearBusinessId() {
  const { clearBusinessId } = useBusinessContext();
  return clearBusinessId;
} 