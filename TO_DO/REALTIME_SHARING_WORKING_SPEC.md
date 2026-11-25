# VolleyLive — Real-time Match Sharing
## Working specification

**Document status:** Working draft v0.3. Owner decisions recorded. Not yet approved for implementation.
**Language:** English (same convention as the other `TO_DO/` specifications)
**Scope:** One authenticated capturing device (producer) per match, any number of read-only consumers (Spectator View, Coach View), with anonymous access for base features and accounts for the rest.

---

## 1. Goal

A person capturing a match pushes each accepted event to a server in real time. Spectators and coaches on their own devices receive every update as it happens. Matches can also be downloaded for offline viewing, and locally captured matches can be pushed to an account later.

---

## 2. Requirements

| ID | Requirement |
|---|---|
| R1 | When online and signed in, each accepted event reaches the server within a few seconds of capture. |
| R2 | Spectator and Coach views reflect every update without manual reload. |
| R3 | Capture keeps working offline. Queued events sync in order on reconnection. |
| R4 | Consumers are read-only. Only the owning producer account can write to a match. |
| R5 | Existing event meaning is unchanged. Historical archives and imports still load. |
| R6 | A consumer that opens or reconnects mid-match gets the full current state. |
| R7 | Corrections and undo propagate as events. Stored events are never edited in place. |
| R8 | Base features work without an account. Other features require an account. |
| R9 | A consumer can download a match and view it offline. |
| R10 | A match captured locally can be pushed to the owner's account, online, at any time. |
| R11 | Each user keeps their own match history. A shared club account is an ordinary account with its own history. |
| R12 | Matches are kept permanently unless deleted by the owner, a club admin, or under a written deletion request. |

---

## 3. Non-goals (v0.2)

- Changing device during a match (no handover). One device captures a match from start to end.
- Several producers writing the same match at the same time.
- Public discovery or listing of matches. Access is by link only.
- Chat, video, biometric data.

---

## 4. Existing facts this design builds on

- Events already carry `eventId`, `matchId`, `sequenceNumber`, `status` (`ACTIVE`, `CORRECTED`, `VOIDED`) and `provenance`. `eventType` includes `CORRECTION`.
- Score, set and match state, rotation, charts and reports are derived from accepted events.
- Schema 2.1 is the portable match document. Spectator and Coach already read a document and derive their views from it. Download and upload use the same document.
- Match Hub has a conflict dialog for an active match. It is reused to refuse a second capture of the same match.

---

## 5. Proposed architecture (starting point, to rework)

```
 [Capture — producer, signed in to push live]
     local store (always) + outbox
             │  HTTPS  POST  /matches/{id}/events     (batch, idempotent, authenticated)
             ▼
 [Backend]
     accounts (users, club accounts) and anonymous sessions
     matches, events, share links  (one owner account per match)
     realtime channel per match    (read-only for consumers)
             │  realtime  (events in sequence order)
             │  GET snapshot / download  (schema 2.1 document)
             ▼
 [Spectator View] [Coach View]   — anonymous via share link, or signed in
     live state  |  downloaded copy for offline viewing
```

### 5.1 Components

- **Producer (Capture).** Writes locally first, exactly as today. Accepted events also go into a persisted outbox, flushed to the server in `sequenceNumber` order. Scoring never waits for the network. Without an account, the match stays local.
- **Backend.** Authenticates producers and consumers. Validates each event against schema 2.1. Stores events by `(matchId, sequenceNumber)`. Ignores duplicates by `eventId`. Pushes events to subscribers. Serves snapshots and downloads.
- **Consumers (Spectator, Coach).** Fetch the snapshot, then subscribe to the realtime channel. Apply events in sequence order. On a gap, refetch from the last applied sequence. A consumer can save the full document for offline viewing.
- **Shared derivation module.** The same code computes state from events in capture and in consumers. This needs the capture-engine split (`docs/handoff`, point 1) as a prerequisite (phase P0).

---

## 6. Decisions

| ID | Decision | Status | Notes |
|---|---|---|---|
| D1 | One writer per match. Writes require the owner's authenticated producer session. | Decided | A second device trying to write is refused with the Match Hub conflict message. No takeover (Q4). |
| D2 | Transport. Producer → server: HTTP POST batches. Server → consumers: the platform's realtime channel. | Decided | SSE is the fallback if the platform's channel does not meet §10 in the spike. |
| D3 | Source of truth | Decided | Server event table. Snapshots and downloads are derived and can be rebuilt. |
| D4 | Ordering | Decided | Producer assigns `sequenceNumber`. Server reports the highest contiguous sequence. Consumers apply only contiguous events. |
| D5 | Corrections | Decided | Appended as `CORRECTION` events. Nothing is edited in place. |
| D6 | Offline capture and upload | Decided | Outbox persisted on device. Completed local matches can be uploaded to an account at any time (R10). |
| D7 | Access | Decided | Reads: anonymous through a share link, read-only. Writes: signed-in owner only. |
| D8 | Hosting | **Decided: managed Postgres-based backend (Supabase), EU region.** | Chosen for auth, row-level security, realtime and managed operations in one product, with plain SQL data that can be exported. Validated in the P1 spike before commitment. Alternatives considered: Firebase (realtime and offline cache built in, but NoSQL and tied to Google) and a self-hosted Python server (full control, more to operate). |
| D9 | Identity | Decided | Consumers: anonymous sessions by default. Owners: accounts. A club account is an ordinary account used by several people. |
| D10 | Ownership and history | Decided | Each match has one owner account. Each user sees their own history. A club account sees its own history, separately. The club account admin manages membership (O1). |
| D11 | Retention and deletion | Decided | Permanent. The owner or a club admin can delete. Deletion requests are honoured. The maintainer runs cleanup only under a written policy (inactive or orphaned data). |
| D12 | Offline download | Decided | A consumer can download the full schema 2.1 document and view it without network. |
| D13 | Share link expiry | Decided | Links expire one month after creation by default. The owner can revoke a link at any time. |
| D14 | Club account administration | Decided | The club account admin adds and removes members (O1). |
| D15 | Minors | Decided | No minor-specific handling (O2). Player data is still treated as personal data under the general privacy review (§14). |

---

## 7. Feature split (proposal, to confirm)

| Feature | Anonymous | Signed in |
|---|---|---|
| Capture locally, no network, no sharing | Yes | Yes |
| View a shared match live (Spectator and Coach views) | Yes, via share link | Yes |
| Download a shared match for offline viewing | Yes | Yes |
| Push a live match to the server (sharing) | No | Yes |
| Upload a locally captured match to the account | No | Yes |
| Personal history across devices | No | Yes |
| Create and revoke share links | No | Yes |
| Club account (shared match library for a team) | No | Yes |

---

## 8. Data contract (draft)

**Batch upload** — `POST /matches/{matchId}/events` (signed-in owner session)

```json
{
  "producerId": "string",
  "events": [ { "...schema 2.1 event..." } ]
}
```

Response:

```json
{
  "acceptedUpTo": 142,
  "rejected": [ { "eventId": "string", "reason": "string" } ]
}
```

**Snapshot and download** — `GET /matches/{matchId}/snapshot` (share link or owner session)

```json
{
  "lastSequence": 142,
  "document": { "...schema 2.1 document..." }
}
```

**Upload of a local match** — same document, sent once to the owner account. Idempotent by `matchId` and `eventId`.

**Realtime** — one channel per match, read-only for consumers. Each message is one event with its `sequenceNumber`. On reconnection the consumer resumes from its last applied sequence.

---

## 9. Behaviour rules

- **Producer** shows the number of pending events and the time of the last successful sync. If it is not signed in, it shows the match as local only.
- **Consumer** shows one of four states: `LIVE`, `RECONNECTING`, `STALE since HH:MM`, or `OFFLINE COPY` (downloaded, no network).
- **Duplicates** are dropped by `eventId`. Re-sending a batch is always safe.
- **Match end** (`COMPLETED`) closes the live channel after the final event. The consumer keeps the final state on screen.
- **Server outage** during a match: capture continues locally. Sharing resumes when the server is back. Nothing is lost.
- **Share link revoked** or **match deleted**: the consumer's live channel closes and shows "no longer available". A downloaded copy stays on the device, as it was downloaded.
- **Consumer opened mid-match** shows the correct score and rotation from the snapshot, then continues with the live channel.

---

## 10. Targets (to validate)

| Metric | Target |
|---|---|
| Capture → consumer display, producer online | ≤ 3 s, typical mobile network |
| Reconnection after 2 min offline (about 20 events) | All events, in order, no duplicates, no reload |
| Download of a full match | Under 5 s on typical mobile network. Size: a few hundred KB per match (estimate, to measure). |

---

## 11. Phases

| Phase | Content | Exit criterion |
|---|---|---|
| P0 | Extract the shared derivation module from the capture engine. | Capture behaviour unchanged. Existing gate green. |
| P1 | Hosting spike on a Supabase EU project. Check: anonymous sign-in, row-level security so a share link is read-only, realtime for one match, download, latency. | Latency within §10. A share link cannot write. Findings recorded in this spec. |
| P2 | Accounts, ownership, owner-scoped history, club account. | Each user sees only their own matches. |
| P3 | Producer outbox and sync. Upload of a completed local match. | Offline capture unchanged. Queue flushes in order. Upload appears in owner history. |
| P4 | Consumers in Spectator and Coach: snapshot, realtime, download, offline copy. | Two-browser test passes (§12). Offline copy opens with no network. |
| P5 | Share links: create, expire, revoke. Deletion and retention. Reconnection and gap handling. Update `docs/ARCHITECTURE.md`, and add new files to `sw.js` `ASSETS`. | All acceptance tests in §12 pass. |

---

## 12. Acceptance tests (draft)

1. **Live path:** an event captured on device A appears on device B within the target in §10.
2. **Offline producer:** 2 min offline with about 20 events. On reconnection all events arrive in order with no duplicates.
3. **Late join:** a consumer opened mid-match shows the correct score and rotation.
4. **Correction:** a `CORRECTION` event updates the consumer state exactly as it updates local state.
5. **Stream drop:** the consumer recovers without reload and without losing sequence.
6. **Read-only:** a share link cannot write to the match, through the UI or the API.
7. **Outage:** with the server unreachable, capture works end to end.
8. **Download:** a consumer downloads a match, turns off the network, and views it.
9. **Upload:** a match captured locally, then uploaded to an account, appears in that account's history and not in another user's.
10. **Club account:** matches uploaded to the club account appear there. Individual histories stay separate.
11. **Deletion:** the owner deletes a match. Its live channel closes and it is no longer available through its share link.

---

## 13. Open questions

- **O1 — Club account governance.** Resolved: the club account admin manages membership (D14). Still open: how the club account is created.
- **O2 — Data export.** Proposed: a user can export their own matches as schema 2.1 JSON at any time.
- **O3 — Deletion policy.** Exact definition of "inactive" or "orphaned" for maintainer cleanup, and the notice period before any cleanup.
- **O4 — Link re-issue.** Not answered: can a new link be issued after one expires or is revoked? Assumed yes, to confirm.

Resolved in v0.3: link expiry is one month (D13). Minors: no specific handling (D15).

---

## 14. Risks

- **Personal data.** Player names are personal data even without a minor-specific category. A privacy review is needed before any data reaches a server.
- **Vendor dependency.** Mitigated by plain SQL data and schema 2.1 export (O2). Check pricing and EU data residency during P1.
- **Two captures by mistake** on the same match. Mitigated by D1.
- **Schema drift** between producer versions. The server must reject unknown `schemaVersion` values, or accept older ones through the existing adapter.
- **Permanent retention** grows storage over time. Estimate per-match size in P1.
- **Scope creep** into a live platform. Keep to one authenticated producer and read-only consumers.

---

## 15. Change log

| Version | Date | Change |
|---|---|---|
| v0.1 | 2026-11-25 | Initial working draft. |
| v0.2 | 2026-11-25 | Owner decisions: hosting (D8), anonymous consumers with accounts for the rest (D7, D9, §7), per-user history and club account (D10), permanent retention with deletion (D11), no device handover (D1, §3), offline download and upload (D6, D12, R9, R10). |
| v0.3 | 2026-11-25 | Owner decisions: club admin manages membership (D14), share links expire after one month (D13), no minor-specific handling (D15). Open items reduced to O1 to O4. |
