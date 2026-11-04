import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { copyToClipboard } from "../lib/clipboard";
import { adminApi, type StatsQuery } from "./api";
import { useToast } from "./toast";

const AUTO_REFRESH_MS = 30_000;

export const queryKeys = {
  all: ["admin"] as const,
  businesses: ["admin", "businesses"] as const,
  stats: (query: StatsQuery) => ["admin", "stats", query] as const,
};

export function useBusinesses() {
  return useQuery({ queryKey: queryKeys.businesses, queryFn: adminApi.listBusinesses });
}

export function useAdminStats(query: StatsQuery) {
  return useQuery({
    queryKey: queryKeys.stats(query),
    queryFn: () => adminApi.getStats(query),
    refetchInterval: AUTO_REFRESH_MS,
    // Keep showing the old numbers while switching period/business, instead of flashing empty.
    placeholderData: keepPreviousData,
  });
}

interface ActionOptions<Result> {
  /** Toast shown on success. */
  success?: string | ((result: Result) => string);
}

/**
 * A dashboard action (pause, delete, create…): runs the request, shows a toast,
 * and reloads every admin query so all panels stay in sync.
 */
export function useAdminAction<Variables, Result>(
  request: (variables: Variables) => Promise<Result>,
  { success }: ActionOptions<Result> = {},
) {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: request,
    onSuccess: async (result) => {
      if (success) showToast(typeof success === "function" ? success(result) : success);
      await queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
    onError: (error) => showToast(error.message),
  });
}

/** Copy with a toast, falling back to a prompt the user can copy from. */
export function useCopy() {
  const showToast = useToast();
  return async (text: string) => {
    if (await copyToClipboard(text)) showToast(`Copied ${text}`);
    else window.prompt("Copy this link:", text);
  };
}
