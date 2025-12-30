"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  leftActions: ReactNode | null;
  setLeftActions: (node: ReactNode | null) => void;
  rightActions: ReactNode | null;
  setRightActions: (node: ReactNode | null) => void;
  clear: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([]);
  const [leftActions, setLeftActionsState] = useState<ReactNode | null>(null);
  const [rightActions, setRightActionsState] = useState<ReactNode | null>(null);

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsState(items);
  }, []);

  const setLeftActions = useCallback((node: ReactNode | null) => {
    setLeftActionsState(node);
  }, []);

  const setRightActions = useCallback((node: ReactNode | null) => {
    setRightActionsState(node);
  }, []);

  const clear = useCallback(() => {
    setBreadcrumbsState([]);
    setLeftActionsState(null);
    setRightActionsState(null);
  }, []);

  return (
    <HeaderContext.Provider value={{
      breadcrumbs, setBreadcrumbs,
      leftActions, setLeftActions,
      rightActions, setRightActions,
      clear
    }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}

export function useHeaderBreadcrumbs(items: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useHeader();

  useEffect(() => {
    setBreadcrumbs(items);
    return () => {
      setBreadcrumbs([]);
    };
  }, [JSON.stringify(items), setBreadcrumbs]);
}

export function useHeaderLeftActions(actions: ReactNode) {
  const { setLeftActions } = useHeader();

  useEffect(() => {
    setLeftActions(actions);
    return () => {
      setLeftActions(null);
    };
  }, [actions, setLeftActions]);
}

export function useHeaderRightActions(actions: ReactNode) {
  const { setRightActions } = useHeader();

  useEffect(() => {
    setRightActions(actions);
    return () => {
      setRightActions(null);
    };
  }, [actions, setRightActions]);
}
