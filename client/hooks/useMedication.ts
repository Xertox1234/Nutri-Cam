import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import type { ProteinSuggestionsResponse } from "@shared/types/protein-suggestions";

interface MedicationLog {
  id: number;
  userId: string;
  medicationName: string;
  brandName: string | null;
  dosage: string;
  takenAt: string;
  sideEffects: string[];
  appetiteLevel: number | null;
  notes: string | null;
}

interface Glp1Insights {
  totalDoses: number;
  daysSinceStart: number | null;
  averageAppetiteLevel: number | null;
  appetiteTrend: "decreasing" | "stable" | "increasing" | null;
  commonSideEffects: { name: string; count: number }[];
  weightChangeSinceStart: number | null;
  lastDoseAt: string | null;
  nextDoseEstimate: string | null;
}

export function useMedicationLogs() {
  return useQuery<MedicationLog[]>({
    queryKey: ["/api/medication/logs"],
  });
}

export function useMedicationInsights() {
  return useQuery<Glp1Insights>({
    queryKey: ["/api/medication/insights"],
  });
}

export function useLogMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      medicationName: string;
      brandName?: string;
      dosage: string;
      sideEffects?: string[];
      appetiteLevel?: number;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/medication/log", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication/logs"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/medication/insights"],
      });
    },
  });
}

export type {
  ProteinSuggestion,
  ProteinSuggestionsResponse,
} from "@shared/types/protein-suggestions";

export function useHighProteinSuggestions(enabled = true) {
  return useQuery<ProteinSuggestionsResponse>({
    queryKey: ["/api/medication/protein-suggestions"],
    enabled,
  });
}
