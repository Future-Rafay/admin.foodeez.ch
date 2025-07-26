"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

interface BusinessContextType {
  businessId: string | null;
  setBusinessId: (id: string) => void;
  clearBusinessId: () => void;
}

const BUSINESS_ID_KEY = 'foodeez_business_id';

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

function getInitialBusinessId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BUSINESS_ID_KEY);
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessId, setBusinessIdState] = useState<string | null>(getInitialBusinessId);

  // Sync state with localStorage
  useEffect(() => {
    if (businessId) {
      localStorage.setItem(BUSINESS_ID_KEY, businessId);
    } else {
      localStorage.removeItem(BUSINESS_ID_KEY);
    }
  }, [businessId]);

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

  // Handle localStorage changes from other tabs/windows
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === BUSINESS_ID_KEY) {
        const newValue = e.newValue;
        setBusinessIdState(newValue);
      }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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