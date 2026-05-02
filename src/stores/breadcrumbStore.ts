import { useEffect } from "react";
import { create } from "zustand";

interface BreadcrumbState {
  labels: Record<string, string>;
}

interface BreadcrumbActions {
  setLabel: (path: string, label: string) => void;
  clearLabel: (path: string) => void;
}

type BreadcrumbStore = BreadcrumbState & BreadcrumbActions;

export const useBreadcrumbStore = create<BreadcrumbStore>()((set) => ({
  labels: {},
  setLabel: (path, label) =>
    set((state) =>
      state.labels[path] === label
        ? state
        : { labels: { ...state.labels, [path]: label } },
    ),
  clearLabel: (path) =>
    set((state) => {
      if (!(path in state.labels)) return state;
      const next = { ...state.labels };
      delete next[path];
      return { labels: next };
    }),
}));

/**
 * Register a friendly label for the current breadcrumb path. Pass `undefined`
 * while the data is still loading — nothing is registered until a label is
 * available, and the entry is cleared on unmount.
 */
export function useDynamicBreadcrumb(
  path: string,
  label: string | undefined | null,
) {
  const setLabel = useBreadcrumbStore((s) => s.setLabel);
  const clearLabel = useBreadcrumbStore((s) => s.clearLabel);

  useEffect(() => {
    if (!path || !label) return;
    setLabel(path, label);
    return () => clearLabel(path);
  }, [path, label, setLabel, clearLabel]);
}
