import { useState, useCallback, useEffect } from "react";
import {
  getSectionState,
  setSectionExpanded,
  getRecentActions,
  pushRecentAction,
  initHomeActionsCache,
  type SectionKey,
} from "@/lib/home-actions-storage";

export function useHomeActions() {
  const [sections, setSections] = useState(getSectionState);
  const [recentActions, setRecentActions] =
    useState<string[]>(getRecentActions);

  useEffect(() => {
    initHomeActionsCache().then(() => {
      setSections(getSectionState());
      setRecentActions(getRecentActions());
    });
  }, []);

  const toggleSection = useCallback((key: SectionKey) => {
    setSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setSectionExpanded(key, next[key]);
      return next;
    });
  }, []);

  const recordAction = useCallback((actionId: string) => {
    pushRecentAction(actionId).then(() => {
      setRecentActions(getRecentActions());
    });
  }, []);

  return { sections, toggleSection, recentActions, recordAction };
}
