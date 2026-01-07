import { useQuery } from '@tanstack/react-query';
import { fetchTokenInfo } from '../api/client';
import type { TokenInfo } from '../api/types';

export function useTokenInfo(tokenAddress: string | null) {
  return useQuery<TokenInfo>({
    queryKey: ['tokenInfo', tokenAddress],
    queryFn: () => fetchTokenInfo(tokenAddress!),
    enabled: !!tokenAddress,
    staleTime: 30000,
  });
}
