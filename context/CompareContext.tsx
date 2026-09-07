"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CompareContextType = {
  compareIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  toggleCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
  canAddMore: boolean;
};

const CompareContext = createContext<CompareContextType | undefined>(
  undefined
);

const STORAGE_KEY = "onekey_compare_properties";
const MAX_COMPARE = 3;

export function CompareProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setCompareIds(
            parsed
              .filter((id): id is string => typeof id === "string")
              .slice(0, MAX_COMPARE)
          );
        }
      }
    } catch (error) {
      console.error("Failed to load comparison properties:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
    } catch (error) {
      console.error("Failed to save comparison properties:", error);
    }
  }, [compareIds, hydrated]);

  const addToCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id) || current.length >= MAX_COMPARE) {
        return current;
      }

      return [...current, id];
    });
  };

  const removeFromCompare = (id: string) => {
    setCompareIds((current) => current.filter((item) => item !== id));
  };

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= MAX_COMPARE) {
        return current;
      }

      return [...current, id];
    });
  };

  const isInCompare = (id: string) => compareIds.includes(id);

  const clearCompare = () => {
    setCompareIds([]);
  };

  const canAddMore = compareIds.length < MAX_COMPARE;

  const value = useMemo(
    () => ({
      compareIds,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      isInCompare,
      clearCompare,
      canAddMore,
    }),
    [compareIds, canAddMore]
  );

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider");
  }

  return context;
}