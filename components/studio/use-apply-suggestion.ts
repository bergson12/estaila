"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ROOM_TYPES,
  STAGING_STYLES,
  BUYER_TARGETS,
  labelFor,
} from "@/lib/constants";
import { useStudio } from "./studio-context";
import { useT } from "@/lib/i18n/provider";

/**
 * Auto-apply Gemini's PhotoAnalysis recommendations to the right-side sidebar
 * selectors of the current Studio tool. Each studio client passes the setters
 * it owns; absent setters are skipped silently.
 *
 * Mapping:
 *   - roomType (label like "Sala") → ROOM_TYPES.value (LIVING)
 *   - suggestedStyle (raw value like "MODERN") → STAGING_STYLES.value
 *   - buyerTarget (label like "Familia con niños") → BUYER_TARGETS.value
 *
 * Re-applies whenever a fresh suggestion arrives (tracked via `appliedAt`).
 */
export function useApplySuggestion(setters: {
  setRoomType?: (v: string) => void;
  setStyle?: (v: string) => void;
  setBuyerTarget?: (v: string) => void;
}) {
  const { suggestion } = useStudio();
  const { t, locale } = useT();
  const lastAppliedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!suggestion) return;
    // Guard against re-applying same suggestion
    if (lastAppliedRef.current === suggestion.appliedAt) return;
    lastAppliedRef.current = suggestion.appliedAt;

    const applied: string[] = [];

    if (setters.setRoomType && suggestion.roomType) {
      const match = ROOM_TYPES.find(
        (r) => r.label.toLowerCase() === suggestion.roomType.toLowerCase()
      );
      if (match) {
        setters.setRoomType(match.value);
        applied.push(`${t.studio.applyRoomPrefix} ${labelFor(ROOM_TYPES, match.value, locale)}`);
      }
    }

    if (setters.setStyle && suggestion.suggestedStyle) {
      // suggestedStyle is already a STAGING_STYLES value
      const match = STAGING_STYLES.find(
        (s) =>
          s.value === suggestion.suggestedStyle ||
          s.label.toLowerCase() ===
            suggestion.suggestedStyle?.toLowerCase()
      );
      if (match) {
        setters.setStyle(match.value);
        applied.push(`${t.studio.applyStylePrefix} ${labelFor(STAGING_STYLES, match.value, locale)}`);
      }
    }

    if (setters.setBuyerTarget && suggestion.buyerTarget) {
      const match = BUYER_TARGETS.find(
        (b) =>
          b.label.toLowerCase() === suggestion.buyerTarget?.toLowerCase()
      );
      if (match) {
        setters.setBuyerTarget(match.value);
        applied.push(`${t.studio.applyBuyerPrefix} ${labelFor(BUYER_TARGETS, match.value, locale)}`);
      }
    }

    if (applied.length > 0) {
      toast.success(t.studio.toastSuggestionsApplied, {
        description: applied.join(" · "),
        duration: 4000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion?.appliedAt]);
}
