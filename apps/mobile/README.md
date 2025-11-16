# Mobile Applications

This folder is reserved for native mobile projects. The existing React Native
client and any future native shells should live here once they are migrated from
the legacy `apps/client-mobile` workspace.

## Data lifecycle and state

Mobile state is organised under `src/state/` with co-located selectors and hooks
for each server-facing domain:

- **Auth slice (`src/state/authSlice.ts`)** tracks the signed-in user, token,
  and session refresh lifecycle. Use `authenticate` to simulate login, and the
  `useAuth*` hooks to drive UI.
- **Payments slice (`src/state/paymentsSlice.ts`)** stores payment history,
  connectivity status, and an offline sync queue. When `setConnectivity(false)`
  is called, `enqueuePayment` will save requests locally with a retry message.
  Coming back online triggers `syncQueuedPayments`, which posts queued payments,
  updates history, and annotates failures with retry guidance.
- **Offers slice (`src/state/offersSlice.ts`)** fetches and caches promotional
  offers via `refreshOffers`, exposing list, status, and error selectors.

`src/state/index.ts` configures the shared store and re-exports all hooks and
mutators. Each slice exposes selectors (`select*`) plus hooks (`use*`) so UI
components can subscribe without manual wiring.
