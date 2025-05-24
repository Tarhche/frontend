import {useQuery} from "@tanstack/react-query";
import {AuthState} from "@/types/api-responses/init";
import {clientDalDriver} from "@/dal/client/client-dal-driver";

export function useInit() {
  return useQuery<AuthState>({
    queryKey: ["init-user"],
    queryFn: async () => {
      const res = await clientDalDriver(window.location.protocol + '//' + window.location.host + `/api/init`);
      return res.data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 10,
    gcTime: Infinity,
  });
}
