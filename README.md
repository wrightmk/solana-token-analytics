# Token Analytics

A real-time solana token analytics dashboard

## Quick Start

### Version

```bash
❯ node --version
v24.9.0

❯ npm --v
11.6.0
```

### Update .env

```bash
VITE_API_KEY=<API_KEY>
VITE_API_TARGET=<API_URL>
VITE_WS_TARGET=<WSS_URL>
```

### Run

```bash
pnpm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter any Solana token address.

**Test with:** `a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump`

---

## Question 1: Performance Debugging (Multi-Tab Lag)

### The Problem

Power users get jittery performance when opening 10+ Trenches tabs (slow mouse, laggy scrolling, choppy hovers). Each tab has 3 columns with live WebSocket updates and long polling.

### How I'd Track It Down

**1. Reproduce & Baseline**

- Open Chrome Performance Monitor, note CPU%, JS Heap, DOM nodes with 1 tab
- Incrementally open tabs (2, 5, 10) to find the inflection point

**2. Profile Main Thread**

- Record 5-10 seconds in Performance tab during lag
- Look for Long Tasks (>50ms red blocks), excessive Layout/Style recalcs
- React DevTools Profiler to find components re-rendering on every WS message

**3. Memory**

- Heap snapshots: 1 tab vs 10 tabs, check for detached DOM nodes, growing arrays
- Allocation timeline to catch objects created faster than GC can collect

**4. Network**

- Count WS messages per second per tab
- 10 tabs × 3 columns × frequent updates = potentially 1000s of messages/sec

### Root Causes & Fixes

| Problem                                 | Fix                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Each tab has independent WS connections | SharedWorker (background thread all tabs share, so only one WS connection exists) |
| High-frequency re-renders               | Batch updates with `requestAnimationFrame`, memoize row components                |
| Long lists                              | Virtualize with `@tanstack/react-virtual`                                         |
| Layout thrashing                        | Use `transform` instead of `top/left`                                             |
| Image loading jank                      | Preload visible token images                                                      |
| Memory accumulation                     | Cap message arrays (e.g., 500 max), trim state when tab backgrounded              |

Essentially: Single SharedWorker manages one WS connection -> broadcasts to all tabs with BroadcastChannel -> each tab batches updates with RAF -> renders through virtualized lists.

## Question 2: Token Analytics Implementation

### Core Requirements

- Search bar for token address input
- Token info display (image, symbol, name, address, mcap, ATH, 24h volume, holders)
- Trades table with last 500 trades (time, trader, buy/sell, SOL amount, price)
- WebSocket real-time updates for metrics

### Optional Extras

- Live trades w/ WebSocket subscription
- Infinite scroll pagination on trades table
- Buffer for new trades when scrolled down (with notification)
- Recently searched tokens with localStorage persistence
- Clear search history button

### Additional

- Auto re-subscription after reconnect
- Message throttling (100ms window) to reduce re-renders
- Transaction deduplication
- Virtualized trades table (@tanstack/react-virtual)
- Dynamically display currency name based on pool (USD1 pairs)

### Tech Stack

- React w/ TypeScript
- Vite
- Tailwind
- TanStack
- Jotai
- react-use-websocket
- lodash

### API Proxy

Vite proxies requests otherwise CORS issues:

- `/api/*` → `<API_URL>/v1/*`
- `/ws/*` → `<WSS_URL>/*`

API key is injected in proxy headers (`vite.config.ts`).

### WebSocket Channel Note

The assignment specified these WebSocket channels:

- Pool Metrics: `pool:activity:{poolAddress}`
- Transactions: `token:transactions:feed:{tokenAddress}`

However, when testing `pool:activity:{poolAddress}`, the messages received didn't contain any metric data. I inspected the network tab on the beta app and discovered it was using `pool:metrics:{poolAddress}` for metrics instead.

I reached out on Telegram for clarification but didn't hear back, so I proceeded with `pool:metrics:{poolAddress}` since that's what the production app uses.

### Things I'd Do With More Time

- Add unit tests for the WebSocket hooks (especially the batching/dedup logic)
- Add the SharedWorker pattern mentioned in question 1 for multi-tab support
- Add proper loading skeletons instead
- Better UX for the copy button. Toast etc
