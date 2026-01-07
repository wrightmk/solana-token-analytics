import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTrades } from '../api/client';
import type { TradesPage } from '../api/types';

export function useTrades(tokenAddress: string | null, poolAddresses?: string[]) {
  return useInfiniteQuery<TradesPage>({
    queryKey: ['trades', tokenAddress, poolAddresses],
    queryFn: async ({ pageParam }) => {
      return fetchTrades({
        tokenAddress: tokenAddress!,
        poolAddresses,
        limit: 500,
        from: pageParam as number | undefined,
      });
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || !lastPage.lastTimestamp) return undefined;
      return lastPage.lastTimestamp;
    },
    enabled: !!tokenAddress,
    staleTime: 10000,
  });
}
