"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ROOM_TYPES,
  STAGING_STYLES,
  BUYER_TARGETS,
} from "@/lib/constants";
import { useStudio } from "./studio-context";

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
        applied.push(`Habitación: ${match.label}`);
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
        applied.push(`Estilo: ${match.label}`);
      }
    }

    if (setters.setBuyerTarget && suggestion.buyerTarget) {
      const match = BUYER_TARGETS.find(
        (b) =>
          b.label.toLowerCase() === suggestion.buyerTarget?.toLowerCase()
      );
      if (match) {
        setters.setBuyerTarget(match.value);
        applied.push(`Buyer: ${match.label}`);
      }
    }

    if (applied.length > 0) {
      toast.success("Recomendaciones IA aplicadas al panel", {
        description: applied.join(" · "),
        duration: 4000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion?.appliedAt]);
}
