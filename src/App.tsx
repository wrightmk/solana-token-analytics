import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TokenAnalytics } from './components/TokenAnalytics'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TokenAnalytics />
    </QueryClientProvider>
  )
}
