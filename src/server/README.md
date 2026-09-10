# Server boundary

`src/server` is the server-only application boundary. It owns authenticated identity checks, role/laboratory/assignment authorization, caller-scoped reads, narrowly defined persistence commands, workflow transitions, audit writes, and report snapshot/render/storage orchestration.

Server entry points receive raw form data and an expected version, resolve the actor from the authenticated session, validate inputs, load the saved specification and observations, and call pure domain functions. They must return the shared `ActionResult<T>` contract from `src/contracts/domain.ts`. A caller never supplies the actor, role, laboratory, verdict, tolerance, rule version, or approval snapshot.

Reads use the caller's cookie-scoped Supabase client so row-level security applies. Sensitive mutations use explicit server-only command boundaries and recheck actor, scope, state, and version under database locks. Calculated results and report snapshots are immutable records with source, rule, input-hash, and engine context.

No browser component imports this directory, a privileged database client, or a server action implementation indirectly through a client-safe module. Route handlers and server actions are the only application-facing adapters. Secrets and credentials remain server-side.

This directory intentionally contains no implementation in the architecture-boundary stage.
