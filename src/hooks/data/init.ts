import {useQuery} from "@tanstack/react-query";
import {AuthState} from "@/types/api-responses/init";
import {clientDalDriver} from "@/dal/client/client-dal-driver";
import {useCookies} from "react-cookie";

export function useInit() {
  const [cookies] = useCookies(['access_token']);
  return useQuery<AuthState>({
    queryKey: ["init-user", cookies.access_token],
    queryFn: async () => {
      const res = await clientDalDriver(window.location.protocol + '//' + window.location.host + `/api/init`);
      return {
        ...res.data,
        status: res.data?.status || 'unauthenticated'
      };
    },
    retry: 1,
    staleTime: 1000 * 60 * 10,
    gcTime: Infinity,
  });
}
