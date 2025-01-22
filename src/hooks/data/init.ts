import {useQuery} from "@tanstack/react-query";
import {AuthState} from "@/types/api-responses/init";
import {fetchWrapper} from "@/lib/client-fetch-wrapper";

export function useInit() {
  return useQuery<AuthState>({
    queryKey: ["init-user"],
    queryFn: async () => {
      return fetchWrapper(`/api/init`);
    },
    retry: 1,
    staleTime: 1000 * 60 * 10,
    gcTime: Infinity,
  });
}
